const MicrosoftTeams = require("./microsoftTeams.model");
const getMongoDBID = require("../helpers/mongoDBUtils");
const auth = require("../helpers/auth");
const graph = require("../helpers/graph");
const Meeting = require('./microsoftTeams.model');
const { BitlyClient } = require('bitly');
const bitly = new BitlyClient('c8cebad1cddff646ce8b99129d409c7101cf0dda', {});
const {log,dateTime}=require('../../config/winston')


function encrypt(data){
  try {
    
    const algorithm = "aes-192-cbc";
    const key = crypto.scryptSync('onetoone','salt', 24);
    const iv = Buffer.alloc(16, 0);
 
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypt = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    console.log("function:encryptphone:",encrypt)
    return encrypt
  } catch(e) {
    return data;
  }
}


  function decrypt(data) {
    try {
      const algorithm = "aes-192-cbc";
      const key = crypto.scryptSync('onetoone','salt', 24);
      const iv = Buffer.alloc(16, 0);
  
      // const cipher = crypto.createCipheriv(algorithm, key, iv);
      // const encrypt = cipher.update('passwordhere', 'utf8', 'hex') + cipher.final('hex');
      // console.log('encrypted', encrypt)
  
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const decrypted = decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
      // console.log(decrypted)
      return decrypted;
    }
    catch(e) {
      return data;
    }
  };



function createEvent(req, res, next){
  log.info(`url:/meetings/v2/create - create meeting event for bookings..user:${req.body.user}..
  date&time:${dateTime}`)
  const user = req.body.user;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const subject = req.body.subject;
  const participants = req.body.participants;

  return auth.getAccessToken().then(function (token) {
    return graph.createEvent(user, token, subject, start_time, end_time, participants,req.body).then(async(resp) => {
      console.log(resp);
      log.info(`url:/meetings/v2/create..successfully create link and get resp...meeting link..
      date&time:${dateTime}`)
      if (resp.onlineMeeting.joinUrl) {
        let shorturl = await getShortUrl(resp.onlineMeeting.joinUrl);
        log.info(`url:/meetings/v2/create..successfully shorturl create link ...meeting link..
      date&time:${dateTime}`)
      const encrypted_meeting_url=encrypt(resp.onlineMeeting.joinUrl);
      const encrypted_shorten_url=encrypt(shorturl.link);

        const teams = new MicrosoftTeams({
          booking_id: req.body.booking_id,
          event_id: resp.id,
          meeting_url:encrypted_meeting_url,
          shorten_url : encrypted_shorten_url
        });
        teams.save()
          .then(savedNotification => {
            log.info(`url:/meetings/v2/create..successfully saved created link in db..
            date&time:${dateTime}`)
            const decrypt_meeting_url=decrypt(savedNotification.meeting_url);
            const decrypt_shorten_url=decrypt(savedNotification.shorten_url);
            savedNotification.meeting_url=decrypt_meeting_url;
            savedNotification.shorten_url=decrypt_shorten_url;

            res.json(savedNotification)})
          .catch(e => {
            log.error(`url:/meetings/v2/create..meeting link not  successfully
             stored in mongo db..date&time:${dateTime}`)
            next(e)});
      }
    }, err => {
      log.error(`url:/meetings/v2/create..error:meeting link not created successfully and
             stored in mongo db..catch block..date&time:${dateTime}`)
      return res.json({"error": `Failed with : ${err}`})
    })
  })

}

async function updateEvent(req, res, next){
  log.info(`url:/microsoftTeam/v2/update -function:updateEvent, update meeting event for booking..
  user:${req.body.user}...event_id:${req.body.event_id}...date&time:${dateTime}`)
  const encrypt_event_id=encrypt(req.body.event_id)
  const user = req.body.user;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;
  const subject = req.body.subject;
  const participants = req.body.participants;
  const event_id = await Meeting.getMeeting(encrypt_event_id,'event_id');
  console.log("function::::updateEvent:::event_id:",event_id)
  // const event_id = await Meeting.getMeeting(req.body.event_id,'event_id');
  //   const event_id = req.body.event_id

  auth.getAccessToken().then(function (token) {
    // Get all of the users in the tenant.
    return graph.updateEvent(user, token, event_id, subject, start_time, end_time, participants).then(resp => {
      log.info(`url:/meetings/v2/update..function:updateEvent..successfully updated link and get resp...meeting link..
      date&time:${dateTime}`)
      return res.json({
        event_id: resp.id
      })
    }, err => {
      log.error(`url:/microsoftTeam/v2/update - function:updateEvent..update meeting event for booking.
      error:failed with ${err}..date&time:${dateTime}`)
      return res.json({"error": `Failed with : ${err}`})
    })
  })

}
async function deleteEvent (req, res) {
  const event_id = req.body.event_id
  const user = req.body.user


  auth.getAccessToken().then(function (token) {
      return graph.deleteEvent(user, token, event_id).then(resp => {
          //console.dir(resp)
          return res.json({
              status: resp.status,
              deleted_at: resp.deleted_at
          })
      }, err => {
          //console.dir(err)
          if(err.code === "ErrorItemNotFound"){
              return res.status(404).json({"error": `${err.code} : Event with ID: ${event_id}, already deleted or doesn't exists.`})
          }else{
              return res.status(400).json({"error": `${err.code} : ${err.message}`})
          }
      })
  })
}





async function cancelEvent(req,res,next){

  log.info(`url:post /microsoftTeam/v2/cancel -function:cancelEvent, cancel meeting event for booking..
  event_id:${req.body.event_id}...user:${req.body.user}....date&time:${dateTime}`)
  const encrypt_event_id=encrypt(req.body.event_id)
  console.log("cancel Event called in ms team")
  const event_id = await Meeting.getMeeting(encrypt_event_id,'event_id');
  // const event_id = await Meeting.getMeeting(req.body.event_id,'event_id');
  console.log("function:cancelEvent::::event_id:"+event_id);
    const user = req.body.user
    const comment = req.body.comment
  
  //  console.log("user:"+user);
  //  console.log("comment:"+comment);

    auth.getAccessToken().then(function (token) {
      // console.log("token"+token)
        return graph.cancelEvent(user, token, event_id, comment).then(resp => {
          log.info(`url:/meetings/v2/cancel..function:cancelEvent..successfully cancel the link and get resp...meeting link..
      date&time:${dateTime}`)
            //  console.log(resp)
            // console.log("status:"+resp.status,"cancelled_at:"+ resp.cancelled_at)
            return res.json({
                status: resp.status,
                cancelled_at: resp.cancelled_at
            })
            
        }, err => {
            //console.dir(err)
            if(err.code === "ErrorItemNotFound"){
              log.error(`url:/microsoftTeam/v2/cancel - function:cancelEvent..cancel meeting event for booking.
      error:failed with ${err.code}:Event with ID: ${event_id}, already cancelled or doesn't exists...date&time:${dateTime}`)
                return res.status(404).json({"error": `${err.code} : Event with ID: ${event_id}, already cancelled or doesn't exists.`})
            }else{
              log.error(`url:/microsoftTeam/v2/cancel - function:cancelEvent..cancel meeting event for booking.
              error:failed with ${err.code}:error message: ${err.message}...date&time:${dateTime}`)
                return res.status(400).json({"error": `${err.code} : ${err.message}`})
            }
        })
    })
}

async function getShortUrl(url){
  let result;
  try {
      result = await bitly.shorten(url);
      log.info(`function:getShortUrl...successfully created bitly url...url:${result}..
      date&time:${dateTime}`)
  } catch(e) {
    log.error(`function:getShortUrl...error:not successfully created bitly url...error:${e}..
      date&time:${dateTime}`)
      throw e;
  }
  return result;
}
module.exports = { createEvent, updateEvent ,getShortUrl,deleteEvent,cancelEvent };
