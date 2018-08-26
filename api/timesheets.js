//Packages required to run timesheet routes
const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

//Packages required to use SQLite DB 
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Middleware to handle timesheetId parameter
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
	//Forms SQL Statement
	const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
	const values = {$timesheetId: timesheetId};
	
	//Gets timesheet based on timesheetId input
	db.get(sql, values, (err, timesheet) => {
		if (err) {
			next(err);
		} else if (timesheet){
			req.timesheet = timesheet;
			next();
		//Returns 404 if timesheet does not exist for given timesheetId
		} else {
			res.sendStatus(404);
		}
	});
});

//Returns all timesheets for the given employeeId 
timesheetsRouter.get('/', (req, res, next) => {
	//Forms SQL Statement
	const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
	const values = {$employeeId: req.params.employeeId};
	
	//Gets all timesheets for the given employeeId
	db.all(sql, values, (err, timesheets) => {
		if (err) {
			next(err);
		} else if(timesheets){
			res.status(200).json({timesheets:timesheets});
		//Returns 404 if no timesheets exist for given employeeId
		} else {
			res.sendStatus(404);
		}
	});
});

//Accepts editable timesheet properties and returns newly created timesheet
timesheetsRouter.post('/', (req, res, next) => {
	//Collect request information
	const hours = req.body.timesheet.hours,
		  rate = req.body.timesheet.rate,
		  date = req.body.timesheet.date;
	
	//Check proper input
	if (!hours || !rate || !date){
		res.sendStatus(400);
	}
	
	//Form SQL Statement
	const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
				'VALUES ($hours, $rate, $date, $employeeId)';
	const values = {
				$hours: hours,
				$rate: rate,
				$date: date,
				$employeeId: req.params.employeeId
	};
	
	//Adds timesheet to database 
	db.run(sql, values, function(err) {
		if (err) {
			next(err);
		} else {
			//Gets newly created timesheet
			db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (err, timesheet) => {
				if (err) {
					next(err);
				} else {
					//Returns newly created timesheet as timesheet property of response body
					res.status(201).json({timesheet: timesheet})
				};
			});
		};
	});
});

//Accepts editable timesheet information and returns the changed timesheet
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
	//Collect request information
	const hours = req.body.timesheet.hours,
		  rate = req.body.timesheet.rate,
		  date = req.body.timesheet.date;
		  
	//Check for proper input
	if (!hours || !rate || !date){
		res.sendStatus(400);
	}
	
	//Form SQL Statement
	const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date ' +
				'WHERE Timesheet.id = $timesheetId';
	const values = {
				$hours: hours,
				$rate: rate,
				$date: date,
				$timesheetId: req.params.timesheetId
	};
	
	//Updates the timesheet 
	db.run(sql, values, function(err) {
		if (err) {
			next(err)
		} else {
			//Gets the updated timesheet
			db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
			(err, timesheet) => {
				//Returns the updated timesheet as timesheet property of response body
				res.status(200).json({timesheet: timesheet});
			});
		}
	});
});

//Deletes the timesheet based on timesheetId
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
	//Form SQL Statement
	const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
	const values = {$timesheetId: req.params.timesheetId};
	
	//Deletes timesheet from database
	db.run(sql, values, (err) => {
		if (err) {
			next(err);
		} else {
			res.sendStatus(204);
		}
	});
});

//Lets timesheetsRouter be used in external scripts
module.exports = timesheetsRouter;