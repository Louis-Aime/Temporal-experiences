/* Temporal tries: demonstrating new calendar classes with Temporal
Character set is UTF-8

Several classes extending Temporal.Calendar, and a limited number of methods.

Class CBCCE, Calendar Cycle Computation Engine 2017-2020, a general engine for basic calendrical computations.
Class MilesianCalendar, a very simple and solid calendar.
Class JulianCalendar, the original Julian calendar as used before 1582, and still used in certain communities
Class WesternCalendar, to be instantiated with the transition date to Gregorian, gives dates in Julian and Gregorian calendars.
	"A.S." and "N.S." (Ancient Style, New Style) are used for distinction.

*/
/* Copyright Miletus 2016-2020 - Louis A. de Fouquières
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
	1. The above copyright notice and this permission notice shall be included
	in all copies or substantial portions of the Software.
	2. Changes with respect to any former version shall be documented.

The software is provided "as is", without warranty of any kind,
express of implied, including but not limited to the warranties of
merchantability, fitness for a particular purpose and noninfringement.
In no event shall the authors of copyright holders be liable for any
claim, damages or other liability, whether in an action of contract,
tort or otherwise, arising from, out of or in connection with the software
or the use or other dealings in the software.
Inquiries: www.calendriermilesien.org
*/
"use strict";

class CBCCE {// Cycle-based Calendar Computation Engine
	constructor (params)
	{ this.params = params }
	
/** params: parameter object structure; On instantiation, replace # with numbers or literals.
 * const decomposeParameterExample = {
 *	timeepoch : #, // origin date or time stamp in elementary units (days, milliseconds...) to be used for the decomposition, with respect to instant 0
 *	coeff : [ // Array of coefficients used to decompose a time stamp into time cycles like eras, quadrisaeculae, centuries, ... down to the elementary unit.
 * 		{cyclelength : #, 	// length of the cycle, in elementary units.
 *		ceiling : #, 		// Infinity, or the maximum number of cycles of this size minus one in the upper cycle; 
 *							// the last cycle may hold an intercalation remainder up to the newt level,
 *							// example: this level is year of 365 days, upper level is 1461 days i.e. the last year holds more than 365 days.
 *		subCycleShift : #, 	// number (-1, 0 or +1) to add to the ceiling of the cycle of the next level when the ceiling is reached at this level;
 *							// to be used for common/embolismic years in a Meton cycle, or for 128-years cycles of 4 or 5 years elementary cycles.
 *		multiplier : #, 	// multiplies the number of cycles of this level to convert into target units.
 *		target : #, 		// the unit (e.g. "year") of the decomposition element at this level. 
 *		} ,					// end of cycle description
 *		{ 		// similar elements at a lower cycle level 
 *		} 		// end of cycle description
 *	], // End of this array, but not end of object
 *	canvas : [ // this last array is the canvas of the decomposition , e.g. "year", "month", "day", with suitable properties at each level.
 *		{ name : #,	// the name of the property at this level, which must match one target property of the coeff component,
 *		init : #, 	// value of this component at epoch, which is the lowest value (except for the first component), 
 *					// e.g. 0 for month, 1 for date, 0 for hours, minutes, seconds.
 *		} // End of array element (only two properties)
 *	] // End of second array
 * }	// End of object.
*/
/** Constraints: 
 *	1. 	The cycles and the canvas elements shall be defined from the largest to the smallest
 *		e.g. four-century, then century, then four-year, then year, etc.
 *	2. 	The same names shall be used for the "coeff" and the "canvas" properties, otherwise functions shall give erroneous results.
*/

/* Errors */
	nonIntegerError = new TypeError ("non integer value for date field")
	dayUnderflowError = new RangeError ("invalid day value, shou1d be 1 or more")
	dayOverflowError = new RangeError ("day value too high for month and year in calendar")
	invalidMonth = new RangeError ("invalid month value for calendar")
	yearUnderflowError = new RangeError ("invalid year value for calendar, specify era")
	invalidEra = new RangeError("invalid era value for calendar and date")
	optionValueError = new RangeError ("invalid value for dateFromFields option in this context")
	uniplementedOption = new RangeError ("option value not implemented")

/* Basic units in milliseconds (former "Chronos" elements) */
	static DAY_UNIT = 86400000 
	static HOUR_UNIT = 3600000
	static MINUTE_UNIT = 60000
	static SECOND_UNIT = 1000

/** Build a compound object from a time stamp holding the elements as required by a given cycle hierarchy model.
 * @param {number} quantity: a time stamp representing the date to convert.
 * @returns {Object} the calendar elements in the structure that params prescribes.
*/
cbcceDecompose (quantity) {
  if (!isNaN (quantity)) quantity -= this.params.timeepoch; // set at initial value the quantity to decompose into cycles. Else leave NaN.
  var result = new Object(); // Construct initial compound result 
  for (let i = 0; i < this.params.canvas.length; i++) 	// Define property of result object (a date or date-time)
    Object.defineProperty (result, this.params.canvas[i].name, {enumerable : true, writable : true, value : this.params.canvas[i].init}); 
  let addCycle = 0; 	// flag that upper cycle has one element more or less (i.e. a 5 years franciade or 13 months luni-solar year)
  for (let i = 0; i < this.params.coeff.length; ++i) {	// Perform decomposition by dividing by the successive cycle length
    if (isNaN(quantity)) 
		result[this.params.coeff[i].target] = NaN	// Case where time stamp is not a number, e.g. out of bounds.
	else {
		let r = 0; 		// r is the computed quotient for this level of decomposition
		if (this.params.coeff[i].cyclelength == 1) r = quantity // avoid performing a trivial division by 1.
		else {		// at each level, search at the same time the quotient (r) and the modulus (quantity)
		  while (quantity < 0) {
			--r; 
			quantity += this.params.coeff[i].cyclelength;
		  }
		  let ceiling = this.params.coeff[i].ceiling + addCycle;
		  while ((quantity >= this.params.coeff[i].cyclelength) && (r < ceiling)) {
			++r; 
			quantity -= this.params.coeff[i].cyclelength;
		  }
		  addCycle = (r == ceiling) ? this.params.coeff[i].subCycleShift : 0; // if at last section of this cycle, add or subtract 1 to the ceiling of next cycle
		}
		result[this.params.coeff[i].target] += r*this.params.coeff[i].multiplier; // add result to suitable part of result array	
	}
  }	
  return result;
}
/** Compute the time stamp from the element of a date in a given calendar.
 * @param {Object} cells: the numeric elements of the date.
 * @param {Object} this.params: the representation of the calendar structure and its connection to the time stamp.
 * @returns {number} the time stamp
*/
cbcceCompose (cells) { // from an object cells structured as params.canvas, compute the chronological number
	var quantity = this.params.timeepoch ; // initialise Unix quantity to computation epoch
	for (let i = 0; i < this.params.canvas.length; i++)  // cells value shifted as to have all 0 if at epoch
		cells[this.params.canvas[i].name] -= this.params.canvas[i].init;
	let currentTarget = this.params.coeff[0].target; 	// Set to uppermost unit used for date (year, most often)
	let currentCounter = cells[this.params.coeff[0].target];	// This counter shall hold the successive remainders
	let addCycle = 0; 	// This flag says whether there is an additional period at end of cycle, e.g. a 5th year in the Franciade or a 13th month
	for (let i = 0; i < this.params.coeff.length; i++) {
		let f = 0;				// Number of "target" values (number of years, to begin with)
		if (currentTarget != this.params.coeff[i].target) {	// If we go to the next level (e.g. year to month), reset variables
			currentTarget = this.params.coeff[i].target;
			currentCounter = cells[currentTarget];
		}
		let ceiling = this.params.coeff[i].ceiling + addCycle;	// Ceiling of this level may be increased 
															// i.e. Franciade is 5 years if at end of upper cycle
		while (currentCounter < 0) {	// Compute f, number of cycles of this level. Cells[currentTarget] may hold a negative figure.
			--f;
			currentCounter += this.params.coeff[i].multiplier;
		}
		while ((currentCounter >= this.params.coeff[i].multiplier) && (f < ceiling)) {
			++f;
			currentCounter -= this.params.coeff[i].multiplier;
		}
		addCycle = (f == ceiling) ? this.params.coeff[i].subCycleShift : 0;	// If at end of this cycle, the ceiling of the lower cycle may be increased or decreased.
		quantity += f * this.params.coeff[i].cyclelength;				// contribution to quantity at this level.
	}
	return quantity ;
}
} // end of CBCCE class

class MilesianCalendar extends Temporal.Calendar { // see www.calendriermilesien.org for details on the Milesian calendar
		constructor () {
		super ("iso8601")
	}
/*
 2. Core id and clockwork references
*/
static id = "milesian"
milesianClockwork = new CBCCE ( { // To be used with day counter from M000-01-01 ie ISO -000001-12-22. Decompose into Milesian year, month, day.
	timeepoch : 0, // Number of days since 1 1m 000 i.e. -000001-12-22
	coeff : [ 
	  {cyclelength : 146097, ceiling : Infinity, subCycleShift : 0, multiplier : 400, target : "year"},
	  {cyclelength : 36524, ceiling :  3, subCycleShift : 0, multiplier : 100, target : "year"},
	  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "year"},
	  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "year"},
	  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"},
	  {cyclelength : 30, ceiling : 1, subCycleShift : 0, multiplier : 1, target : "month"}, 
	  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
	],
	canvas : [ 
		{name : "year", init : 0},
		{name : "month", init : 1},
		{name : "day", init : 1}
	]
	}, // end of parameter object
	)
/*
 3. Origin date, and last date worked out
*/
originDate = Temporal.Date.from ("-000001-12-22") // This information should probably be inserted into params object
usedDate = Temporal.Date.from ("-000001-12-22") // initiated with Milesian epoch origin, i.e; M000-01-01
usedComponents = { year : 0, month : 1, day : 1 }
/*
 4. Basic mechanism to set the Milesian date components from a standard date given. Avoid redoing computations at each call for a same date.
*/
update_internal (date) { // update internal register to date given as a parameter.
	if (! date.equals (this.usedDate)) {
		this.usedComponents = this.milesianClockwork.cbcceDecompose (date.withCalendar("iso8601").difference(this.originDate).days);
		this.usedDate = Temporal.Date.from (date, {overflow : "reject"});
		}
	}
/*
5. Standard and non-standard methods
*/
year (date) {
	this.update_internal (date);
	return this.usedComponents.year
	}
month (date) {
	this.update_internal (date);
	return this.usedComponents.month
	}
day (date) {
	this.update_internal (date);
	return this.usedComponents.day
	}
era (date) { return undefined }
internalIsLeapYear (year) {
	let y = year + 1;
	// y = (y < 0 ? y-400*Math.floor(y / 400): y);	// This is useless, since mod 0 is searched, so no side effect of remainder operator (%)
	return ( (y % 4 == 0) && ( ! (y % 100 == 0) || (y % 400 == 0)) )
	}
isLeapYear (date) {
	this.update_internal (date);
	return this.internalIsLeapYear (this.usedComponents.year)
	}
dateFromFields (components, options = {overflow : "constrain"}) {
	switch (options.overflow) {
		case undefined : options.overflow = "constrain"; 
		case "constrain" : case "balance" : case "reject" : break;
		default : throw this.milesianClockwork.optionValueError;
		}
	if (! Number.isInteger(components.year ) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) 
		throw this.milesianClockwork.nonIntegerError;
	if (components.month < 1 || components.month > 12) throw this.milesianClockwork.invalidMonth;
	if (components.day < 1) throw this.milesianClockwork.dayUnderflowError;
	let overflow = 
		components.day > 31
		|| components.month > 12
		|| (components.day > 30 && ( components.month % 2 == 1 || (components.month == 12 && !this.internalIsLeapYear (components.year))));
	if (overflow && options.overflow == "reject") throw this.milesianClockwork.dayOverflowError;
	if (overflow && options.overflow == "constrain") {
		components.month = Math.min (components.month, 12);
		components.day = Math.min (components.day, 
			(( components.month % 2 == 1 || (components.month == 12 && !this.internalIsLeapYear (components.year))) ? 30 : 31));
		}
	let myOffset = this.milesianClockwork.cbcceCompose(components); // Date elements first tested.
	this.usedComponents = this.milesianClockwork.cbcceDecompose (myOffset); // Save corrected date.
	this.usedDate = this.originDate.plus( { days : myOffset }, { overflow : "reject" } )
	return this.usedDate.withCalendar(this); // Add calendar to the Temporal.Date object returned
	}
toDateString (date) { // non standard
	this.update_internal (date);
	let absYear = Math.abs(this.usedComponents.year);
	return  this.usedComponents.day + " " + this.usedComponents.month + "m " 
			+ ((this.usedComponents.year < 0) ? "-": "") 
			+ ((absYear < 100) ? "0" : "") + ((absYear < 10) ? "0" : "") + absYear; 
	}
} // end of calendar object/class

/*
 1. Class declaration for Julian calendar, nothing in constructor, reference to iso8601
*/
class JulianCalendar extends Temporal.Calendar { // Construct a class at the same level as built-in
	constructor () {
		super ("iso8601")
	}
/*
  2. Core id and clockwork references
*/
static id = "julian"  
julianClockwork = new CBCCE ({ // To be used with day counter from Julian 0000-03-01 ie ISO 0000-02-28. Decompose into Julian years, months, date.
	timeepoch : 0, // Number of days since 1 martius 0 i.e. 0000-02-28
	coeff : [ 
	  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "year"}, // 4 Julian years
	  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "year"}, // One 365-days year
	  {cyclelength : 153, ceiling : Infinity, subCycleShift : 0, multiplier : 5, target : "month"}, // Five-months cycle
	  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"}, // 61-days bimester
	  {cyclelength : 31, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "month"}, // 31-days month
	  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
	],
	canvas : [ 
		{name : "year", init : 0},
		{name : "month", init : 3}, // Shifted year begins with month number 3 (March), thus simplify month shifting
		{name : "day", init : 1}
	]
	} // end of parameter object 
	) // end of new declaration
/*
 3. Origin date, and last date worked out
*/
originDate = Temporal.Date.from ("0000-02-28") // This information should probably be inserted into params object
usedDate = Temporal.Date.from ("-000001-12-30") // initiated with Anno Domini origin
usedComponents = { era : "B.C.", year : 1, month : 1, day : 1 }
/*
 4. Basic mechanism to set the Milesian date components from a standard date given. Avoid redoing computations at each call for a same date.
*/
/** romanShift : from standard Roman (Julian or Gregorian) date compound with year beginning in January, build a shifted date compound, year beginning in March
 * @param {{year : number, month: number, date: number}} - figures of a date in Julian calendar (or possibly Gregorian) 
 * @return {{year : number, month: number, date: number}} - the shifted date elements. year is same year or -1, Jan and Feb are shifted by 12
*/
romanShift (romanDate) {
	if (romanDate.month < 1 || romanDate.month > 12) return undefined;  // Control validity of month only. Day may be negative or greater than 31. 
	let shiftDate = Object.assign ({},romanDate); // shiftDate = {...romanDate}; -- does not work with MS edge
	if (romanDate.month < 3) {
		shiftDate.year -= 1;
		shiftDate.month += 12
	}
	return shiftDate
}
/** romanUnshift : from shifted Roman (Julian or Gregorian) date compound with year beginning in March, build the standard date compound, year beginning in January
 * @param {{year : number, month: number, date: number}} - figures of shifted date, month 2 to 13 
 * @return {{year : number, month: number, date: number}} - the standard Roman date elements. year is same year or +1, 12 and 13 are shifted by -12
*/
romanUnshift (shiftDate) {
	if (shiftDate.month < 3 || shiftDate.month > 14)  return undefined;  // Control validity of month only. Day may be negative or greater than 31. 
	let romanDate = Object.assign ({},shiftDate); // romanDate = {...shiftDate}; -- does not work with MS edge
	if (shiftDate.month > 12) {
		romanDate.year += 1;
		romanDate.month -= 12
	}
	return romanDate
}
update_internal (date) { // if date in parameter is different from last, update internal register to date given as a parameter.
	if (! date.equals (this.usedDate)) {
		this.usedComponents = this.romanUnshift(this.julianClockwork.cbcceDecompose (date.withCalendar("iso8601").difference(this.originDate).days));
		if (this.usedComponents.year > 0) this.usedComponents.era = "A.D."
			else {
			this.usedComponents.era = "B.C.";
			this.usedComponents.year = 1 - this.usedComponents.year;
			}
		}
		this.usedDate = Temporal.Date.from (date, {overflow : "reject"});
	}
/*
5. Standard and non-standard methods
*/
year (date) {
	this.update_internal (date);
	return this.usedComponents.year;
	}
month (date) {
	this.update_internal (date);
	return this.usedComponents.month;
	}
day (date) {
	this.update_internal (date);
	return this.usedComponents.day;
	}
era (date) { 
	this.update_internal (date);
	return this.usedComponents.era 
	}

internalIsLeapYear (year) { // year in relative notation, positive or negative
	return (year % 4 == 0) 	// works even for negative numbers.
}
isLeapYear (date) { // 
	this.update_internal (date);
	return ((this.usedComponents.era != "B.C.") ? this.internalIsLeapYear(this.usedComponents.year) :  this.internalIsLeapYear(this.usedComponents.year-1))
	}
	
dateFromFields (components, options = {overflow : "constrain"}) {
	// check parameter values
	switch (options.overflow) {
		case undefined : options.overflow = "constrain"; 
		case "constrain" : case "balance" : case "reject" : break;
		default : throw this.julianClockwork.optionValueError;
		}
	if (! Number.isInteger(components.year) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) throw this.julianClockwork.nonIntegerError;
	if (components.era == undefined) components.era = "A.D.";
	if (components.year < 1) throw this.julianClockwork.yearUnderflowError; 
	switch (components.era) {
		case "B.C.": components.year = 1 - components.year; // translate to relative year counting 
		case "A.D.": break;
		default : throw this.julianClockwork.invalidEra ;
		}
	if (components.month < 1 || components.month > 12) throw this.julianClockwork.invalidMonth;
	if (components.day < 1) throw this.julianClockwork.dayUnderflowError;
	// switch to relative representation for years, compute date and save effective date fields
	let myOffset = this.julianClockwork.cbcceCompose(this.romanShift(components)); // Translate Julian compound into an Offset...
	this.usedDate = this.originDate.plus({ days: myOffset},{overflow:"reject"}); // Establish date from elements, deemed Julian
	this.usedComponents = this.romanUnshift(this.julianClockwork.cbcceDecompose (myOffset)); // Come back to compound and save it.
	// Here usedComponents and components still hold year value in relative.
	// Manage overflow option
	let overflow = // any difference between source and target ?
		(this.usedComponents.year != components.year
		|| this.usedComponents.month != components.month
		|| this.usedComponents.day != components.day)
	if (overflow) switch (options.overflow) {
		case "reject": throw this.julianClockwork.dayOverflowError;
		case "balance": break; // the standard algorithm balances day value
		case "constrain": 		// in this case recompute
			components.day = Math.min (components.day, 
				(components.month < 8 && components.month % 2 == 1) || (components.month > 7 && components.month % 2 == 0) ? 31 :
				(components.month > 3 ? 30 :
					(this.internalIsLeapYear (components.year) // at this point we are still in relative counting.
					? 29 : 28 )));
				let myOffset = this.julianClockwork.cbcceCompose(this.romanShift(components)); // Translate Julian compound into an Offset...
				this.usedDate = this.originDate.plus({days: myOffset},{overflow:"reject"}); // Establish date from elements, deemed Julian
				this.usedComponents = this.romanUnshift(this.julianClockwork.cbcceDecompose (myOffset)); // Come back to compound and save it.
	}
	// back to 1-year representation
	if (components.year < 1) components.year = 1 - components.year ;	// return given parameter as initially passed
	if (this.usedComponents.year < 1) {this.usedComponents.year = 1 - this.usedComponents.year; this.usedComponents.era = "B.C."}
		else this.usedComponents.era = "A.D.";
	return this.usedDate.withCalendar(this); // with the calendar
	}

toDateString (date) { // non standard
	this.update_internal (date);
	return  this.usedComponents.day + "/" + this.usedComponents.month + "/" 
			+ (this.usedComponents.year) + " " + this.usedComponents.era; 
	}
} // end of calendar class

/*
 1. Class declaration for a western calendar. The transition to Gregorian date and a name shall be given. Reference to iso8601.
*/
class WesternCalendar extends Temporal.Calendar { // Construct real calendars for most European countries
	constructor (switchingDate, name) {
		super ("iso8601");
		this._name = name;
		this.switchingDate = Temporal.Date.from(switchingDate);	// first date where Gregorien calendar is used
		if (Temporal.Date.compare (this.switchingDate, Temporal.Date.from("1582-10-15")) == -1) 
			throw new RangeError ("Gregorian transition is on or after 1582-10-15");
	}
/*
 2. Epoch references, calendar mechanism, standard conversion from a standard date to the specific date elements
*/
firstSwitchDate = Temporal.Date.from ("1582-10-15") // First date of A.S. or N.S. era
usedDate = Temporal.Date.from ("1582-10-15") // initiated with Anno Domini origin
usedComponents = { era : "N.S.", year : 1582, month : 10, day : 15 }
julianCalendar = new JulianCalendar
gregorianCalendar = new Temporal.Calendar("iso8601")

update_internal (date) { // if date in parameter is different from last, update internal registers to canonical date given in parameter.
	let myDate = date.withCalendar("iso8601");
	if (!myDate.equals (this.usedDate)) {
		if (Temporal.Date.compare (date, this.switchingDate) >= 0) {// in Gregorian period
			this.usedComponents = myDate.getFields(); // was Object.assign
			// delete usedComponents.calendar;	// avoid complications
			this.usedComponents.era = "N.S.";
			} 
		else { // date components are Julian, declare "A.S." era in place of "A.D." 
			this.usedComponents = myDate.withCalendar(this.julianCalendar).getFields();
			if (this. usedComponents.era == "A.D.") this.usedComponents.era = "A.S.";
		}
		this.usedDate = Temporal.Date.from (myDate, {overflow : "reject"});
	}
}
/*
3. Standard and non-standard methods. Here the fields results strictly from the calendar's rule
*/
era (date) { 
	this.update_internal (date);
	return this.usedComponents.era 
	}
year (date) {
	this.update_internal (date);
	return this.usedComponents.year;
	}
month (date) {
	this.update_internal (date);
	return this.usedComponents.month;
	}
day (date) {
	this.update_internal (date);
	return this.usedComponents.day;
	}
isLeapYear (date) { // a same year, like 1700, may be leap at the begining, then common...
	this.update_internal (date);
	let e = this.usedComponents.era, y = (e == "B.C." ? 1 - this.usedComponents.year : this.usedComponents.year) ;
	return 	(y % 4 == 0 && (e != "N.S." || (y % 100 != 0 || y % 400 == 0)))
	}
	
dateFromFields (components, options = {overflow : "constrain"}) { // here the result may respect the user's choice
	var myComponents = {}, testDate;		// internal variables
	// check parameter values
	switch (options.overflow) { // balance value is not implemented
		case undefined : options.overflow = "constrain";  break;
		case "balance" : throw this.julianCalendar.julianClockwork.uniplementedOption; break;
		case "constrain" : case "reject" : break;
		default : throw this.julianCalendar.julianClockwork.optionValueError;
		}
	if (! Number.isInteger(components.year) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) throw this.julianCalendar.julianClockwork.nonIntegerError;
	if (components.year < 1) throw this.julianCalendar.julianClockwork.yearUnderflowError; 
	switch (components.era) {
		// case "B.C.": components.year = 1 - components.year; // no translation to relative year counting !!!!
		case "A.D.": delete components.era ; // here user does not tell much about date, it is like undefined.
		case "B.C.": case "A.S.": case "N.S.": case undefined: break;
		default : throw this.julianCalendar.julianClockwork.invalidEra ;
		}
	if (components.month < 1 || components.month > 12) throw this.julianCalendar.julianClockwork.invalidMonth;
	if (components.day < 1) throw this.julianCalendar.julianClockwork.dayUnderflowError;
/*	
If era is unspecied, first compare the Gregorian presentation to the switching date. 
If era specified, the caller knows what he wants, date is analysed following era indication, but result is aligned with present calendar.
If after, confirm "N.S.". If before, mark "A.S."; "B.C."  MUST be specified, negative years are rejected.
If era is specified, "A.S"/"N.S.", analysis is guided by era specified, 
Range error is thrown for any "N.S." date before 1582-10-15.
*/	
	delete components.calendar;		// to avoid attemp to construct a wrong date - not all is implemented

	if (components.era == undefined) {	// era not user-defined, result will be canonical date presentation
		testDate = Temporal.Date.from (components); // Date.Calendar.dateFromFields was prefered. Here "balance" is not available, hence no control
		if (Temporal.Date.compare (testDate, this.switchingDate) >= 0) {// on or after transition date
			testDate = Temporal.Date.from (components,options);		// new request, with options
			myComponents = testDate.getFields();
			// delete usedComponents.calendar;	// avoid complications
			components.era = "N.S.";
			myComponents.era = "N.S.";
			//this.usedComponents = this.usedDate.withCalendar("iso8601").getFields();
		} else {
			if (components.era == "A.S.") components.era = "A.D." //for Julian calendar analysis
			testDate = this.julianCalendar.dateFromFields (components, options);
			if (components.era == "A.D.") components.era = "A.S."; // A.D. always converted to A.S.
			myComponents = testDate.withCalendar(this.julianCalendar).getFields(); //this.usedComponents = testDate.withCalendar(this.julianCalendar).getFields();
			myComponents.era = components.era; // for the A.S. translation
		}
	}
	else // here the follow user's A.S. or N.S. indication.
		if (components.era == "N.S.") {
			testDate = Temporal.Date.from (components, options);
			if (Temporal.Date.compare (testDate, this.firstSwitchDate) < 0) throw this.julianCalendar.julianClockwork.invalidEra;
			myComponents = testDate.withCalendar("iso8601").getFields(); // this.usedComponents 
			myComponents.era = "N.S.";
		}
		else {
			myComponents.era = components.era; // save asked
			if (components.era == "A.S.") components.era = "A.D.";	// "A.S." is rejected with the plain julian calendar.
			testDate = this.julianCalendar.dateFromFields (components, options);
			components.era = myComponents.era ; // retrieve "A.S." if needed
			myComponents = testDate.withCalendar(this.julianCalendar).getFields(); // this.usedComponents 
			myComponents.era = components.era; // retrieve "A.S." if needed
		}
/* Overflow situation was detected during Julian or Gregorian analysis */
	let overflow = // any difference between source and target; has been solved through "constrain" meanwhile.
		(myComponents.era != components.era		// has been completed if undefined on entry
		|| myComponents.year != components.year // in JulianCalendar, year is maintained as initially asked
		|| myComponents.month != components.month
		|| myComponents.day != components.day)
	if (overflow && options.overflow == "reject") throw this.julianCalendar.julianClockwork.dayOverflowError;

/* finalise: store date and components */	
	this.update_internal (testDate); // the absolute date and the canonical presentation from testDate
	return this.usedDate.withCalendar(this);
	}

toDateString (date) { // non standard
	this.update_internal (date);
		return  this.usedComponents.day + "/" + this.usedComponents.month + "/" 
			+ (this.usedComponents.year) + " " + this.usedComponents.era 
	}
} // end of calendar class