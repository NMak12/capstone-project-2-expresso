//Packages required to run employee routes and timesheet subresource
const express = require('express');
const employeesRouter = express.Router();
const timesheetsRouter = require('./timesheets')

//Packages required to use SQLite DB 
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Middleware to handle employeeId parameter
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
	//Forms SQL Statement
	const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
	const values = {$employeeId: employeeId};
	
	//Gets employee based on employeeId input
	db.get(sql, values, (err, employee) => {
		if (err) {
			next(err);
		} else if(employee){
			req.employee = employee;
			next();
		//Returns 404 if employee does not exist for given employeeId 
		} else {
			res.sendStatus(404);
		}
	});
});

//Middleware to handle timesheet subresource
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter)

//Returns all employees that are employed 
employeesRouter.get('/', (req, res, next) => {
	db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1', (err, employees) => {
		if (err){
			next (err);
		} else if (employees) {
			res.status(200).json({employees: employees});
		}
	});
});

//Accepts editable employee properties and returns newly created employee
employeesRouter.post('/', (req, res, next) => {
	//Collect request information
	const name = req.body.employee.name, 
		  position = req.body.employee.position,
		  wage = req.body.employee.wage, 
		  isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
		  
	//Check proper input
	if (!name || !position || !wage) {
		res.status(400);
	}
	
	//Forms SQL Statement
	const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
				'VALUES ($name, $position, $wage, $isCurrentEmployee)';
	const values = {
		$name: name,
		$position: position,
		$wage: wage, 
		$isCurrentEmployee: isCurrentEmployee
	};
	
	//Adds employee to database
	db.run(sql, values, function(err) {
		if (err) {
			next(err);
		} else {
			//Gets newly created employee
			db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (err, employee) => {
				if (err) {
					next(err)
				} else {
					//Returns newly created employee as employee property of response body
					res.status(201).json({employee:employee})
				};
			});
		};
	});
}); 

//Returns employee information for the given employeeId
employeesRouter.get('/:employeeId', (req, res, next) => {
	res.status(200).json({employee: req.employee});
});

//Accepts editable employee information and returns the changed employee
employeesRouter.put('/:employeeId', (req, res, next) => {
	//Collect request information
	const name = req.body.employee.name, 
		  position = req.body.employee.position,
		  wage = req.body.employee.wage, 
		  isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
		  
	//Check for proper input 
	if (!name || !position || !wage) {
		res.sendStatus(400);
	}
	
	//Forms SQL Statement
	const sql = 'UPDATE Employee SET name = $name, position = $position, ' + 
				'wage = $wage, is_current_employee = $isCurrentEmployee ' +
				'WHERE Employee.id = $employeeId';
	const values = {
		$name: name,
		$position: position,
		$wage: wage, 
		$isCurrentEmployee: isCurrentEmployee,
		$employeeId: req.params.employeeId
	};
	
	//Updates the employee 
	db.run(sql, values, function(err) {
		if (err) {
			next(err)
		} else {
			//Gets the updated employee
			db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
				if(err){
					next(err)
				} else {
					//Returns updated employee as emplyoee property of response body
					res.status(200).json({employee:employee});
				}
			});
		};
	});	
});

//Sets an employee to "unemployed" and returns the unemployed employee 
employeesRouter.delete('/:employeeId', (req, res, next) => {
	//Forms SQL Statement
	const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
	const values = {$employeeId: req.params.employeeId};
	
	//Sets an employee to "unemployed" status
	db.run(sql, values, (err) => {
		if (err) {
			next(err)
		} else {
			//Gets the updated (unemployed) employee 
			db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
				if(err){
					next(err)
				} else {
					//Returns the unemployed employee information as the employee property of response body
					res.status(200).json({employee:employee})
				}
			});
		};
	});
});

//Lets employeesRouter be used in external scripts
module.exports = employeesRouter;