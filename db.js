if  ( typeof Array.prototype.contains == "undefined" ) {
	Array.prototype.contains = function( value ) {
	  var self = this;
	  var result = false;
	  var fn = function ( elem, index, self ) {
	    if ( elem == value ) {
	      result = true;
	    } // end if value
	  }; // end function fn

	  self.forEach( fn );
	  return result;
	}; // end function where
} // end if not array.prototype.contains

/**
 * Sql lite plugin helper
 */
function DbHelper( dbName ) {
	dbName = dbName + ".db";
	this.dataBase =  window.sqlitePlugin.openDatabase(
		{
			name: dbName
		}
	);
} // end function DbHelper

/**
 * Exception used in DbHelper
 */
function DbException( message ) {
	   this.message = message;
	   this.name = "DbException";
} // end function DbExeption

/**
 * The actual database connection
 */
DbHelper.prototype.dataBase = null;

/**
 * Handles the onError event
 * @param error
 */
DbHelper.prototype.onError = function ( error ) {
	dlg.showAlert(
		error.message,
		"Error",
		"Ok"
	);
};

/**
 * Handles the onSuccess event
 *
 */
DbHelper.prototype.onSuccess = function () {

};

/**
 * Perform a query and return results
 * @param sql The sql statement
 * @param params Parameters for sql statement
 * @param onSuccess Function that handle the response. Expects an array or item collections,
 * the actual rows
 */
DbHelper.prototype.query = function ( sql, params, onSuccess ) {

	var self = this;

	var result = [];

	var fn = function (tran, response) {

		if ( response.hasOwnProperty( 'rows' ) ) {
			var len = response.rows.length;
			var i;

			for ( i = 0; i < len; i++ ) {
				result.push(response.rows.item(i));
			} // end for
		} // end if

		onSuccess ( result );
	} // end fn

	self.exec( sql, params, fn);

	return result;
}; // end function query

/**
 * Executes a query. It may return data, but must be handled in response.rows.item format
 * @param sql The sql Statement
 * @param params The parameters
 * @param onSuccess The callback function
 */
DbHelper.prototype.exec = function ( sql, params, onSuccess ) {

	var self = this;

	if ( params == null || params == 'undefined' ) {
		params = []
	}

	var keys = Object.keys(params);

	if ( keys.length > 0 ) {
		if ( isNaN ( keys[0] ) ) {
			//	Here is assoc
			//	Sql Statement must contain :
			if ( sql.indexOf(":") == -1 ) {
				throw new DbException("No parameters in sql statement")
			}

			var i = 0;
			var count = keys.length;
			var newParams = [];
			var newParam = {};
			var positions = [];

			for ( i = 0; i < keys.length; i++ ) {
				position = sql.indexOf( ":" + keys[i] );
				positions.push(position);
				sql = sql.replace( ":" + keys[i], "?" );

				newParam = {};
				newParam.position = position;
				newParam.value = params[keys[i]];
				newParams.push(newParam);
			} // end for

			var fnSort = function(a, b){
				return a-b
			};

			positions = positions.sort(fnSort);

			var finalParams = [];
			for( i in positions ) {
				for ( j in newParams ) {
					if ( newParams[j].position == positions[i] ) {
						finalParams.push( newParams[j].value );
					} // end if newParams.position = positions[i]
				} // end for params
			} // end for positions
			params = finalParams;
		} else {
			//	Here is just list
			//	Sql statement must contains ?
			if ( sql.indexOf("?") == -1 ) {
				throw new DbException("No parameters in sql statement")
			} // end if sql.indexOf
		} // end if else NaN(keys[0])
	} // end if keys.lenght > 0

	var fn = function ( tran ) {
		tran.executeSql(sql, params, onSuccess, self.onError);
	};


	console.log(sql);
	console.log(params);
	self.dataBase.transaction(
		fn,
		self.onError,
		self.onSuccess
	);

};

/**
 * Execute a bulk upsert
 * @param tableName Name of table
 * @param data Collection of assoc arrays
 * @param keyFields Array with the name of the fields that are keys
 */
DbHelper.prototype.bulkUpsert = function ( tableName, data, keyFields) {
    var len = data.length;
    var i;
    for ( i = 0; i < len; i++ ) {
    	db.upsert(tableName, data[i], keyFields);
    }
};

/**
 * Perform an upsert on a database table
 * @param tableName The table name
 * @param tableData The assoc array with the data, field => value
 * @param keyFields An array with the fields that are key
 */
DbHelper.prototype.upsert = function ( tableName, tableData, keyFields ) {

	var self = this;

	var sql = "";
	var where = "";
	var values = "";
	var fields = "";
	var i;
	var len;
	var whereParams = {};

	if ( tableData == null ) {
		throw new DbException("No data to insert");
		return;
	}

	if ( keyFields != null ) {
		if ( Array.isArray( keyFields ) ) {
			len = keyFields.length;
			for ( i=0; i<len; i++ ) {
				where += " " + keyFields[i] + " = :" + keyFields[i];
				whereParams[keyFields[i]] = tableData[keyFields[i]];
			} // end for
		} // end if array
	} // end if keyfields not null

	//	Prepare count
	sql = "SELECT COUNT(*) AS cont FROM @tableName WHERE @where";

	sql = sql.replace("@tableName", tableName);
	sql = sql.replace("@where", where);

	var fnCountOk = function ( response ) {
		var row = response[0];
		var count = row['cont'];

		if ( count > 0 ) {
			//	Here is update

			//	Create the values
			var keys = Object.keys(tableData);
			len = keys.length;

			for ( i=0; i<len; i++ ) {
				if ( where != "" ) {
					if ( ! keyFields.contains( keys[i] ) ) {
						//	Here there is no key
						if ( values == "" ) {
							values += keys[i] + " = :" + keys[i];
						} else {
							values += ", " + keys[i] + " = :" + keys[i];
						} // end if then else values = ""
					} // end if indexOf keyFiels
				} // end if where != ""
			} // end for each key

			//	Prepare update
			sql = "UPDATE @tableName SET @values WHERE @where";
			sql = sql.replace("@tableName", tableName);
			sql = sql.replace("@values", values);
			sql = sql.replace("@where", where);

			var fnUpdateOk = function( tran, response) {
				console.log("Update OK " + sql);
				console.log('tableData');
			};

			self.exec(sql, tableData, fnUpdateOk);

		} else {
			//	Here is INSERT
			//	Create the values
			var keys = Object.keys(tableData);
			len = keys.length;

			for ( i=0; i<len; i++ ) {
				if ( values == "" ) {
					values += ":" + keys[i];
					fields += keys[i];
				} else {
					values += ", :" + keys[i];
					fields += "," + keys[i];
				} // end if then else values = ""
			} // end for each key

			//	Prepare update
			sql = "INSERT INTO @tableName ( @fields ) VALUES ( @values );";
			sql = sql.replace("@tableName", tableName);
			sql = sql.replace("@values", values);
			sql = sql.replace("@fields", fields);

			var fnInsertOk = function( tran, response) {
				console.log("Insert OK" );
			};

			self.exec(sql, tableData, fnInsertOk);
		}
	};

	self.query( sql, whereParams, fnCountOk);

}; // end function upsert

/**
 * Execute a sql script
 * @param scriptFile The url to the script file
 */
DbHelper.prototype.execScript = function ( scriptFile ) {

	var self = this;

	var onSuccess = function ( tran, response ) {
		console.log ( 'onSuccess response' );
		console.log ( response );
	};

	var fn = function( scriptSql ) {

		scriptSql = scriptSql.replace(/(\r\n|\n|\r)/gm," ");
		var statements = scriptSql.split(";");
		var count = statements.length;
		var i;

		for ( i = 0; i < count; i++ ) {
			console.log ( statements[i] );
			console.log ( 'statements[' + i + ']' );
			self.dataBase.executeSql(statements[i]);
		}
	}

	var fnError = function(XMLHttpRequest, textStatus, errorThrown) {
		console.log("Algo paso con el servidor: ");
		console.log(errorThrown);
		dlg.showAlert(
			"Algo paso con el servidor: " + errorThrown,
			"Error",
			"OK"
		);
	}

	$.ajax({
		  url: scriptFile,
		  dataType: 'text',
		  success: fn,
		  error: fnError
		});
}; // end function execScript
