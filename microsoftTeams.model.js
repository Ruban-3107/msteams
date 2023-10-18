const Promise = require('bluebird');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const Schema = mongoose.Schema;

/**
 * admin Schema
 */
const MicrosoftTeamSchema = new mongoose.Schema({
  booking_id: {
    type: Schema.Types.ObjectId,
    ref: '_booking'
  },
  event_id: {
    type: String,
    required: true
  },
  meeting_url: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  shorten_url :{
    type: String
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
MicrosoftTeamSchema.method({
});

/**
 * Statics
 */
MicrosoftTeamSchema.statics = {

  getMeeting(id,key) {
    return this.findById(id)
      .exec()
      .then((meeting) => {
      if (meeting) {
          // console.log('booking-=-=>>',booking);
          return meeting[key];
      }
      const err = new APIError(
          "No such meeting exists!",
          httpStatus.NOT_FOUND,
          httpStatus.st
      );
    return Promise.reject(err);
    });
  }
};

// /**
//  * @typedef Setting
//  */
module.exports = mongoose.model('_meeting', MicrosoftTeamSchema);
