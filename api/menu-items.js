//Packages required to run menu-items routes
const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

//Packages required to use SQLite DB
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Middleware to handle menuItemId parameter
menuItemsRouter.param('menuItemId', (req, res, next, menuItemsId) => {
	//Forms SQL Statement
	const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
	const values = {$menuItemId: req.params.menuItemId};
	
	//Gets menu items based on menuItemId input
	db.get(sql, values, (err, menuItem) => {
		if (err) {
			next(err);
		} else if (menuItem){
			req.menuItem = menuItem;
			next();
		//Returns 404 if menu item does not exist for given menuItemId
		} else {
			res.sendStatus(404);
		}
	});
});

//Returns all menu items for the given menuId
menuItemsRouter.get('/', (req, res, next) => {
	//Forms SQL Statement
	const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
	const values = {$menuId: req.params.menuId};
	
	//Gets all menu items for the given menuId
	db.all(sql, values, (err, menuItems) => {
		if (err) {
			next(err);
		} else if(menuItems){
			res.status(200).json({menuItems: menuItems});
		//Returns 404 if no menu items exist for given menuId 
		} else {
			res.sendStatus(404);
		}
	});
});

//Accepts editable menu item properties and reutrns newly created menu item
menuItemsRouter.post('/', (req, res, next) => {
	//Collects menu item information
	const name = req.body.menuItem.name,
		  description = req.body.menuItem.description,
		  inventory = req.body.menuItem.inventory,
		  price = req.body.menuItem.price
		  
	//Checks proper inpput
	if (!name || !description || !inventory || !price){
		res.sendStatus(400);
	}
	
	//Forms SQL Statement 
	const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) ' +
				'VALUES ($name, $description, $inventory, $price, $menuId)';
	const values = {
				$name: name,
				$description: description, 
				$inventory: inventory, 
				$price: price, 
				$menuId: req.params.menuId
	};
	
	//Adds menu item to database
	db.run(sql, values, function(err) {
		if (err) {
			next(err);
		} else {
			//Gets newly created menu item
			db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (err, menuItem) => {
				if (err) {
					next(err);
				} else {
					//Returns newly created menu item as menuItem property of response body 
					res.status(201).json({menuItem:menuItem});
				};
			});
		};
	});
});

//Accepts editable menu item information and returns the changed menu item
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
	//Collects request information
	const name = req.body.menuItem.name,
		  description = req.body.menuItem.description,
		  inventory = req.body.menuItem.inventory,
		  price = req.body.menuItem.price
	
	//Check for proper input
	if (!name || !description || !inventory || !price){
		res.sendStatus(400);
	}
	
	//Forms SQL Statement
	const sql = 'UPDATE MenuItem SET name = $name, description = $description,' +
				'inventory = $inventory, price = $price ' + 
				'WHERE MenuItem.id = $menuItemId';
	const values = {
				$name: name,
				$description: description,
				$inventory: inventory,
				$price: price,
				$menuItemId: req.params.menuItemId
	};
	
	//Updates the menu item
	db.run(sql, values, (err) => {
		if(err) {
			next(err)
		} else {
			//Gets the updated menu item
			db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
			(err, menuItem) => {
				//Returns the updated menu item as menuItem property of reponse body
				res.status(200).json({menuItem: menuItem});
			});
		};
	});
});

//Deletes the menu item based on menuItemId
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
	//Forms SQL Statement
	const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
	const values = {$menuItemId: req.params.menuItemId};
	
	//Deletes menu item from database
	db.run(sql, values, (err) => {
		if (err) {
			next(err);
		} else {
			res.sendStatus(204);
		};
	});
});

//Lets menuItemsRouter be used in external scripts
module.exports = menuItemsRouter;