const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');

const microsoftTeamCtrl = require('./microsoftTeams.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/create')
  /** post /meetings/v2/create - create meeting event for bookings */
  .post(microsoftTeamCtrl.createEvent);

router.route('/update')
  /** post /microsoftTeam/v2/update - update meeting event for booking */
  .post(microsoftTeamCtrl.updateEvent);

router.route('/delete')
.delete(microsoftTeamCtrl.deleteEvent)

router.route('/cancel')  
/** post /microsoftTeam/v2/cancel - cancel meeting event for booking */
.post(microsoftTeamCtrl.cancelEvent)

module.exports = router;
