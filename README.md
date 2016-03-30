# dbhelper-cordova-sqlite-storage
Helper for the great plugin Cordova-sqlite-storage

This is a helper for plugin Cordova-sqlite-storage (https://github.com/litehelpers/Cordova-sqlite-storage).
The goal is make more simple the use of the plugin (already excellent), because I like to use shorter more maintainable code.

**Important** In order to use this component, you must first install Cordova-sqlite-storage (https://github.com/litehelpers/Cordova-sqlite-storage).

## Usage

### Include
```html
<script src="db.js"></script>
```

<h3>Declaration</h3>
```js
var db = new DbHelper("mydb");
// mydb Es el nombre de la db
```

<h3>Script execution (i.e. create initial structure):</h3>
```js
db.execScript ( "sqlscripts/setup.sql" );
```

In sqlscripts/setup:
```sql
CREATE TABLE IF NOT EXISTS
	schools (
		school_id int PRIMARY KEY ASC,
		school_name text
	);
```

<h3>Simple query:</h3>
```js
// Variable to store the sql
var sql = "SELECT * FROM schools WHERE school_id = :schoolId";

// Variable to store the parameters, if any
var params = {};
params['schoolId'] = 9901;

// Variable for store the function to apply
// Expects an object, assoc array.

// prints:
// [{ school_id: "9001", "school_name":"PABLO LIVAS"},{ school_id: "9002", "school_name":"ADOLFO PRIETO"}]
var fn = function ( result ) {
    console.log( result );
};

// Call query
db.query(
    sql,
    params,
    fn
);

/*  Anothe example */
// We can also declare params simply with ?

// Variable to store the sql
var sql = "SELECT * FROM schools WHERE school_id = ?";

// Variable to store the parameters, if any
var params = [9901];

// Variable for store the function to apply
// Expects an object, assoc array.

// prints something like:
// [{ school_id: "9001", "school_name":"PABLO LIVAS"},{ school_id: "9002", "school_name":"ADOLFO PRIETO"}]
var fn = function ( result ) {
    console.log( result );
};

// Call query
db.query(
    sql,
    params,
    fn
);

```

To query with no parameters:
```js
db.query(
  sql,
  null,
  fn
);
```

<h3>Inserts and updates:</h2>
The helper uses "upserts" statements. If record exists, updates, else, inserts.

```js
// Name of the table
var tableName = "schools";

// Object with data
var tableData = {
    "shool_id": 9003,
    "school_name": "MOISEIS SAENS";
};

// Array with list of key fields
var keyFields = ["school_id"];

// Call upsert
db.upsert(tableName, tableData, keyFields);

```

<h4>Batch inserts / updates:</h4>
Same as previous function, but the data is an array of objects.

```js
// Table name
var tableName = "schools";

// Object array (the data)
var tableData = [
    {
        "shool_id": 9003,
        "school_name": "MOISEIS SAENS";
    },
    {
        "shool_id": 9004,
        "school_name": "JERONIMO SILLER";
    }
];

// Array with a list of the key fields
var keyFields = ["school_id"];

// Call bulkUpsert
db.bulkUpsert(tableName, tableData, keyFields);
```

The use is simple, useful, short and elegant.
