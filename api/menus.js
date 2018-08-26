//Packages required to run menu routes and menu item subresource
const express = require('express');
const menusRouter = express.Router();
const menuItemsRouter = require('./menu-items');

//Packages required to use SQLite DB
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Middleware to handle menuId parameter
menusRouter.param('menuId', (req, res, next, menuId) => {
	//Forms SQL Statement
	const sql = 'SELECT * FROM Menu WHERE Menu.Id = $menuId';
	const values = {$menuId: menuId};
	
	//Gets menu based on menuId input
	db.get(sql, values, (err, menu) => {
		if (err) {
			next(err);
		} else if(menu){
			req.menu = menu;
			next();
		} else {
			//Returns 404 if menu does not exist for given menuId
			res.sendStatus(404);
		};
	});
});

//Middleware to handle menu item subresource
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//Returns all menus 
menusRouter.get('/', (req, res, next) => {
	db.all('SELECT * FROM Menu', (err, menus) => {
		if (err) {
			next(err);
		} else if (menus) {
			res.status(200).json({menus:menus});
		} else {
			res.sendStatus(404);
		}
	});
})

//Accepts editable menu properties and returns newly created menu
menusRouter.post('/', (req, res, next) => {
	//Collect request information
	const title = req.body.menu.title;
	
	//Check proper input
	if (!title){
		res.sendStatus(400);
	}
	
	//Form SQL Statement
	const sql = 'INSERT INTO Menu (title) ' +
				'VALUES ($title)';
	const values = {$title: title};
	
	//Adds menu to database
	db.run(sql, values, function(err) {
		if (err) {
			next(err);
		} else {
			//Gets newly created menu
			db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (err, menu) => {
				if (err) {
					next(err)
				} else {
					//Returns newly created menu as menu property of response body
					res.status(201).json({menu:menu})
				};
			});
		};
	});
});

//Returns all menu information for the given menuId
menusRouter.get('/:menuId', (req, res, next) => {
	res.status(200).json({menu: req.menu});
});

//Accepts editable menu information and returns the changed menu
menusRouter.put('/:menuId', (req, res, next) => {
	//Collects request information
	const title = req.body.menu.title;
	
	//Check for proper input
	if (!title){
		res.sendStatus(400);
	}
	
	//Form SQL Statement
	const sql = 'UPDATE Menu SET title = $title ' +
				'WHERE Menu.id = $menuId';
	const values = {
		$title: title,
		$menuId: req.params.menuId
	};
	
	//Updates the menu
	db.run(sql, values, (err) => {
		if (err) {
			next(err)
		} else {
			//Gets the updated menu
			db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (err, menu) => {
				if(err){
					next(err)
				} else {
					//Returns the updated menu as menu property of response body
					res.status(200).json({menu:menu});
				}
			});
		};
	});
});

//Deletes a menu if it has no related menu items 
menusRouter.delete('/:menuId', (req, res, next) => {
	//Forms SQL Statemetn
	const menuItemSql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
	const menuItemValues = {$menuId: req.params.menuId};
	
	//Gets any related menu items based on menuId
	db.get(menuItemSql, menuItemValues, (err, menuItem) => {
		if (err) {
			next(err);
		} else if (menuItem) {
			//Returns 400 if menu has any related menu items
			res.sendStatus(400);
		} else {
			//FormsSQL Statement
			const deleteSql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
			const deleteValues = {$menuId: req.params.menuId};
			
			//Deletes menu based on menuId
			db.run(deleteSql, deleteValues, (err) => {
				if (err) {
					next(err);
				} else {
					res.sendStatus(204);
				}
			});
		}
	});
});

//Lets menusRouter be used in external scripts
module.exports = menusRouter;