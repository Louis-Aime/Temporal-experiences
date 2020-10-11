/* Temporal tries: demonstrating new calendar classes with Temporal
Character set is UTF-8

Several classes extending Temporal.Calendar, and a limited number of methods.

Class CBCCE, Calendar Cycle Computation Engine 2017-2020, a general engine for basic calendrical computations.
Class Chronos: useful values and a "mod" function (different from %)
Class CalendricalErrors: Type and range errors for calendrical computations.
Class MilesianCalendar, a very simple and solid calendar.
Class JulianCalendar, the original Julian calendar as used before 1582, and still used in certain communities
Class WesternCalendar, to be instantiated with the transition date to Gregorian, gives dates in Julian and Gregorian calendars.
	"A.S." and "N.S." (Ancient Style, New Style) are used for distinction.

As of 2020-10-11:
	MilesianCalendar is complete, although MonthDay and YearMonth do not work
	JulianCalendar and WesternCalendar only implement .dateFromFields and methods or Date.

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

/** Build a compound object from a time stamp holding the elements as required by a given cycle hierarchy model.
 * @param {number} quantity: a time stamp representing the date to convert.
 * @returns {Object} the calendar elements in the structure that params prescribes.
*/
cbcceDecompose (askedQuantity) {
  if (isNaN (askedQuantity)) throw CalendricalErrors.notANumber;
  let quantity = askedQuantity - this.params.timeepoch; // set at initial value the quantity to decompose into cycles.
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
 * @param {Object} askedCells: the numeric elements of the date.
 * @param {Object} this.params: the representation of the calendar structure and its connection to the time stamp.
 * @returns {number} the time stamp
*/
cbcceCompose (askedCells) { // from an object askedCells structured as params.canvas, compute the chronological number
	var cells = {...askedCells}, quantity = this.params.timeepoch; // initialise Unix quantity to computation epoch
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

class Chronos {
/* Basic units in milliseconds */
	static DAY_UNIT = 86400000 
	static HOUR_UNIT = 3600000
	static MINUTE_UNIT = 60000
	static SECOND_UNIT = 1000
/* modulo function */
	static mod (a, d) {		//same sign as d, not as a. You may check negative value of years.
		return ( a*Math.sign(d) >= 0 ? a % d : (a % d + d) % d)
	}
	static divmod (a, d) {
		if (d <= 0) throw CalendricalErrors.nonPositiveDivisor;
		let quotient = 0, modulo = a;
		while (modulo < 0) {
			--quotient;
			modulo += d;
		}
		while (modulo > d) {
			++quotient;
			modulo -= d;
		}
		return { quotient : quotient, modulo : modulo }
	}
}

class CalendricalErrors {
	static notANumber = new TypeError ("non numeric value in CBCCE")
	static nonInteger = new TypeError ("non integer value for date field")
	static nonPositiveDivisor = new RangeError ("non positive divisor in calendrical division")
	static dayUnderflow = new RangeError ("negative or 0 day value")
	static dayOverflow = new RangeError ("invalid day value in month, year, era of calendar")
	static invalidMonth = new RangeError ("invalid month value for calendar")
	static yearUnderflow = new RangeError ("invalid year value for calendar, specify era")
	static invalidEra = new RangeError("invalid era value for calendar and date")
	static invalidOrder = new RangeError ("wrong order of dates or wrong duration")
	static invalidOption = new RangeError ("invalid value for option in this context")
	static uniplementedOption = new RangeError ("option value not implemented")
}

class MilesianCalendar extends Temporal.Calendar { 
/*
 1. Class declaration for Milesian calendar, nothing in constructor, reference to iso8601
*/
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
static originDate = Temporal.Date.from ("-000001-12-22") // This information should probably be inserted into params object
registerDate = Temporal.Date.from ("-000001-12-22") // initiated with Milesian epoch origin, i.e; M000-01-01
registerComponents = { year : 0, month : 1, day : 1 }
registerOffset = 0;
/*
 4. Basic mechanism to set the Milesian date components from a standard date given. 
 Avoid redoing computations at each call for a same date.
*/
updateRegister (date) { // update internal register to date given as a parameter.
	if (! date.equals (this.registerDate)) {
		this.registerOffset = date.withCalendar("iso8601").difference(MilesianCalendar.originDate).days;
		this.registerComponents = this.milesianClockwork.cbcceDecompose (this.registerOffset);
		this.registerDate = Temporal.Date.from (date, {overflow : "reject"});
		}
	}
/*
 5. Main date generator from Milesian date elements. Note that the Temporal.Date object shall be initiated 
 with the ISO representation.
*/ 
dateFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct = Temporal.Date) {
	var components = { ...askedComponents}, options = {...askedOptions};
	switch (options.overflow) {
		case undefined : options.overflow = "constrain"; 
		case "constrain" : case "balance" : case "reject" : break;
		default : throw CalendricalErrors.invalidOption;
		}
	if (! Number.isInteger(components.year ) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) 
		throw CalendricalErrors.nonInteger; 
	if (components.month < 1 || components.month > 12) throw CalendricalErrors.invalidMonth; // always reject months indication that cannot be handled
	// if (components.day < 1) throw CalendricalErrors.dayUnderflow;
	let overflow = 
		components.day < 1
		|| components.day > 31
		|| (components.day > 30 
			&& ( components.month % 2 == 1 || (components.month == 12 && !MilesianCalendar.internalIsLeapYear (components.year))));
	if (overflow && options.overflow == "reject") throw CalendricalErrors.dayOverflow;
	if (overflow && options.overflow == "constrain") {
		components.day = Math.min (components.day, 
			(( components.month % 2 == 1 || (components.month == 12 && !MilesianCalendar.internalIsLeapYear (components.year))) ? 30 : 31));
		components.day = Math.max (components.day, 1);
		}
	let myOffset = this.milesianClockwork.cbcceCompose(components); // Date elements first tested.
	this.registerComponents = this.milesianClockwork.cbcceDecompose (myOffset); // Save corrected date elements.
	this.registerOffset = myOffset;
	this.registerDate = MilesianCalendar.originDate.plus( { days : myOffset }, { overflow : "reject" } );
	let isoFields = this.registerDate.getISOFields();
	return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this);
	}

yearMonthFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct=Temporal.YearMonth) {
	var components = { ...askedComponents}; 
	components.day = 13;	// Year and month for that day is always the same in Milesian and ISO 8601
	let myDate = this.dateFromFields(components, askedOptions);
	let myFields = myDate.getFields(); // should be the calendar's field normalised, or with error thrown
	return new Construct(myFields.year, myFields.month, this, 13);
}

monthDayFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct=Temporal.MonthDay) {
	var components = { ...askedComponents}; 
	components.year = 1999;		// a Milesian leap year after Unix epoch, following the most complex rule
	let myDate = this.dateFromFields(components, askedOptions);
	let myFields = myDate.getFields();
	return new Temporal.MonthDay(myFields.month, myFields.day, this, 1999);
}
/*
6. Methods for Date
*/
year (date) {
	this.updateRegister (date);
	return this.registerComponents.year
	}
month (date) {
	this.updateRegister (date);
	return this.registerComponents.month
	}
day (date) {
	this.updateRegister (date);
	return this.registerComponents.day
	}
era (date) { return undefined }

daysInWeek (date) {return 7}
dayOfWeek (date) {
	return date.withCalendar("iso8601").dayOfWeek // not super.dayOfWeek
}

daysInYear (date){
	return (this.isLeapYear(date) ? 366 : 365) // this.updateRegister(date) implied
}
dayOfYear (date) {
	this.updateRegister(date);
	let m = this.registerComponents.month - 1;
	return this.registerComponents.day + 30*(m % 2) + 61*Math.floor (m/2)
}

weekOfYear (date) {
	this.updateRegister(date);
	let caractDay = Temporal.Date.from({year : this.registerComponents.year, month : 1, day : 7, calendar : this}); // This day always falls on week 0
	let origin = 8 - caractDay.dayOfWeek ; // This is the Day Of Year of week's 0 Monday.
	let elapsedWeek = Math.floor ((this.dayOfYear(date)-origin) / 7); 
	return elapsedWeek < 0  	// current week is last week of preceding year. This last week is 51, or 52 in two cases
		? (origin == 7 || (origin == 6 && MilesianCalendar.internalIsLeapYear (this.registerComponents.year - 1)) ? 52 : 51)
		: elapsedWeek;
} 

yearOfWeek (date)	{	// Proposal. Year in the week's calendar corresponding to weekOfYear of the date. New API entry to develop.
	this.updateRegister(date);
	switch (this.registerComponents.month) {
		case 1  : return this.weekOfYear(date) > 5 ? this.registerComponents.year - 1 : this.registerComponents.year;
		case 12 : return this.weekOfYear(date) < 5 ? this.registerComponents.year + 1 : this.registerComponents.year;
		default : return this.registerComponents.year
	}
}

daysInMonth (date) {
	this.updateRegister(date);
	let m = this.registerComponents.month - 1;
	return m % 2 == 0 ? 30 : ( m == 11 && !MilesianCalendar.internalIsLeapYear (this.registerComponents.year) ? 30 : 31)
}

monthsInYear (date) { return 12 }

static internalIsLeapYear (year) {
	let y = year + 1;
	return (Chronos.mod (y,4) == 0 && ( Chronos.mod (y, 100) != 0 || Chronos.mod (y, 400) == 0))	 //( (y % 4 == 0) && ( ! (y % 100 == 0) || (y % 400 == 0)) )
	}
isLeapYear (date) {
	this.updateRegister (date);
	return MilesianCalendar.internalIsLeapYear (this.registerComponents.year)
	}

/*
 7. Methods for use with Duration.
*/
dateAdd (date, duration, options={overflow:"constrain"}, Construct) {// Add a +/- duration - internal, but not static
	/* In solar calendars, the only case where "reject" would throw shall be
		duration in year and months only
		keeping the same day (31) would make change to the next month.
	In all other cases, the request is to add days to a date, so reject mode is cancelled and effective mode is balance.
	*/
	this.updateRegister(date);
	// take years months and weeks apart, 
	// This does not work called from Date object: let myDuration = duration.with ({years: 0, months: 0, weeks: 0}, {overflow: "balance"});
	let myDuration = Temporal.Duration.from (duration, {overflow: "balance"}); // balance HMS to days. Other fields are not affected.
	let days = duration.weeks*this.daysInWeek + duration.days; // effective days to add, including regular weeks
	myDuration = new Temporal.Duration 
		({years : duration.years, 
		months: duration.months, 
		days: duration.weeks*this.daysInWeek + myDuration.days}); // duration.days balanced with HMS of original duration
	let components = {...this.registerComponents};
	let addedYearMonth = Chronos.divmod ( this.registerComponents.month + duration.months - 1, 12 );
	components.year += (duration.years + addedYearMonth.quotient); 
	components.month = addedYearMonth.modulo + 1; 
	// handle overflow option
	if (myDuration.days == 0 && date.days == 31 
		&& (components.month % 2 == 1 || (components.month == 12 && !MilesianCalendar.internalIsLeapYear(components.year))))
		switch (options.overflow) {
			case "constrain" : components.day = 30; break;
			case "reject" : throw CalendricalErrors.dayOverflow; break;
			default : throw CalendricalErrors.invalidOption; 
		}
		else components.day += duration.days + myDuration.days;
	return this.dateFromFields (components, {overflow : "balance"}, Construct); 
}
datePlus (date, duration, options, Construct) {
	return this.dateAdd(date, duration, options, Construct) // 
}
dateMinus (date, duration, options, Construct) {
	//let myDuration = duration.negated();		// "duration.negated is not a function ???" necessary to construct new object.
	let myDuration = Temporal.Duration.from(duration);
	return this.dateAdd(date, myDuration.negated(), options, Construct) 
}
dateDifference (smaller, larger, options={largestUnits:"days"}) {
	switch (options.largestUnits) {
		case "years": case "months": case "weeks": case "days": break; // normally "weeks" should not be implemented
		default : throw CalendricalErrors.invalidOption
	}
	switch (Temporal.Date.compare(smaller, larger)) {
		case 1 : // throw CalendricalErrors.invalidOrder; break;
			let positiveDifference = this.dateDifference (larger, smaller, options);
			return positiveDifference.negated(); break;
		case 0 : return Temporal.Duration("P0D"); break;
		case -1 :{
			let myLarger = { year : larger.year, month : larger.month, day : larger.day },
				mySmaller = { year : smaller.year, month : smaller.month, day : smaller.day },
				myDayOffset = this.milesianClockwork.cbcceCompose(myLarger) - this.milesianClockwork.cbcceCompose(mySmaller),
				myWeekOffset = 0, withhold = 0, dayDiff = 0, monthDiff=0, yearDiff=0;
/* 
It could seem more logical to distinguish between 30 == last day of month, and 30 == not the last one
In practical, better results are obtained by cutting all months to 30.
			myLarger.day = larger.day == larger.daysInMonth ? 31 : larger.day;	// For computation, all months finish on 30. Variant: on 31.
			mySmaller.day = smaller.day == smaller.daysInMonth ? 31 : smaller.day;
*/
			myLarger.day = Math.min (myLarger.day, 30); mySmaller.day = Math.min (mySmaller.day, 30); // end of month is 30 for years-month reckoning
			if (myLarger.day >= mySmaller.day)	// did not suceed in destructuring affectation {dayDiff, withhold} = ...
				{ dayDiff = myLarger.day - mySmaller.day; withhold = 0 }
				else { dayDiff = myLarger.day - mySmaller.day + 30; withhold = 1 };
			if (myLarger.month >= mySmaller.month + withhold)
				{ monthDiff = myLarger.month - mySmaller.month - withhold; withhold = 0 } 
				else { monthDiff = myLarger.month - mySmaller.month - withhold + 12; withhold = 1};
			yearDiff = myLarger.year - mySmaller.year - withhold;
			switch (options.largestUnits) {
				case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
				case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
				case "weeks" : 
					let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek);
					return Temporal.Duration.from({weeks : weekDayCompound.quotient, days : weekDayCompound.modulo}); break;
				case "days"  : return Temporal.Duration.from({ days: myDayOffset }); break;
				default: throw CalendricalErrors.invalidOption
			}
		}
	}
}
/*
 8. A non-standard method that helps...
*/
toDateString (date) { // non standard
	this.updateRegister (date);
	let absYear = Math.abs(this.registerComponents.year);
	return  this.registerComponents.day + " " + this.registerComponents.month + "m " 
			+ ((this.registerComponents.year < 0) ? "-": "") 
			+ ((absYear < 100) ? "0" : "") + ((absYear < 10) ? "0" : "") + absYear; 
	}
} // end of calendar object/class

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
static originDate = Temporal.Date.from ("0000-02-28") // This information should probably be inserted into params object
registerDate = Temporal.Date.from ("-000001-12-30") // initiated with Anno Domini origin
registerComponents = { era : "B.C.", year : 1, month : 1, day : 1 }
/*
 4. Basic mechanism to set the Milesian date components from a standard date given. Avoid redoing computations at each call for a same date.
*/
/** romanShift : from standard Roman (Julian or Gregorian) date compound with year beginning in January, build a shifted date compound, year beginning in March
 * @param {{year : number, month: number, date: number}} - figures of a date in Julian calendar (or possibly Gregorian) 
 * @return {{year : number, month: number, date: number}} - the shifted date elements. year is same year or -1, Jan and Feb are shifted by 12
*/
static romanShift (romanDate) {
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
static romanUnshift (shiftDate) {
	if (shiftDate.month < 3 || shiftDate.month > 14)  return undefined;  // Control validity of month only. Day may be negative or greater than 31. 
	let romanDate = Object.assign ({},shiftDate); // romanDate = {...shiftDate}; -- does not work with MS edge
	if (shiftDate.month > 12) {
		romanDate.year += 1;
		romanDate.month -= 12
	}
	return romanDate
}
updateRegister (date) { // if date in parameter is different from last, update internal register to date given as a parameter.
	if (! date.equals (this.registerDate)) {
		this.registerComponents = JulianCalendar.romanUnshift(this.julianClockwork.cbcceDecompose (date.withCalendar("iso8601").difference(JulianCalendar.originDate).days));
		if (this.registerComponents.year > 0) this.registerComponents.era = "A.D."
			else {
			this.registerComponents.era = "B.C.";
			this.registerComponents.year = 1 - this.registerComponents.year;
			}
		}
		this.registerDate = Temporal.Date.from (date, {overflow : "reject"});
	}
/*
5. Standard and non-standard methods
*/
year (date) {
	this.updateRegister (date);
	return this.registerComponents.year;
	}
month (date) {
	this.updateRegister (date);
	return this.registerComponents.month;
	}
day (date) {
	this.updateRegister (date);
	return this.registerComponents.day;
	}
era (date) { 
	this.updateRegister (date);
	return this.registerComponents.era 
	}

static internalIsLeapYear (year) { // year in relative notation, positive or negative
	return (Chronos.mod (year, 4) == 0) 	// works even for negative numbers.
}
isLeapYear (date) { // 
	this.updateRegister (date);
	return ((this.registerComponents.era != "B.C.") ? JulianCalendar.internalIsLeapYear(this.registerComponents.year) :  JulianCalendar.internalIsLeapYear(1-this.registerComponents.year))
	}
	
dateFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct = Temporal.Date) {
	var components = { ...askedComponents}, options = {...askedOptions};
	// check parameter values
	switch (options.overflow) {
		case undefined : options.overflow = "constrain"; 
		case "constrain" : case "balance" : case "reject" : break;
		default : throw CalendricalErrors.invalidOption;
		}
	if (! Number.isInteger(components.year) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) throw CalendricalErrors.nonInteger;
	if (components.era == undefined) components.era = "A.D.";
	if (components.year < 1) throw CalendricalErrors.yearUnderflow; 
	switch (components.era) {
		case "B.C.": components.year = 1 - components.year; // translate to relative year counting 
		case "A.D.": break;
		default : throw CalendricalErrors.invalidEra ;
		}
	if (components.month < 1 || components.month > 12) throw CalendricalErrors.invalidMonth;
	if (components.day < 1) throw CalendricalErrors.dayUnderflow;
	// switch to relative representation for years, compute date and save effective date fields
	let myOffset = this.julianClockwork.cbcceCompose(JulianCalendar.romanShift(components)); // Translate Julian compound into an Offset...
	this.registerDate = JulianCalendar.originDate.plus({ days: myOffset},{overflow:"reject"}); // Establish date from elements, deemed Julian
	this.registerComponents = JulianCalendar.romanUnshift(this.julianClockwork.cbcceDecompose (myOffset)); // Come back to compound and save it.

	// Here registerComponents and components still hold year value in relative.
	// Manage overflow option
	let overflow = // any difference between source and target ?
		(this.registerComponents.year != components.year
		|| this.registerComponents.month != components.month
		|| this.registerComponents.day != components.day)
	if (overflow) switch (options.overflow) {
		case "reject": throw CalendricalErrors.dayOverflow;
		case "balance": break; // the standard algorithm balances day value
		case "constrain": 		// in this case recompute
			components.day = Math.min (components.day, 
				(components.month < 8 && components.month % 2 == 1) || (components.month > 7 && components.month % 2 == 0) ? 31 :
				(components.month > 3 ? 30 :
					(JulianCalendar.internalIsLeapYear (components.year) // at this point we are still in relative counting.
					? 29 : 28 )));
				let myOffset = this.julianClockwork.cbcceCompose(JulianCalendar.romanShift(components)); // Translate Julian compound into an Offset...
				this.registerDate = JulianCalendar.originDate.plus({days: myOffset},{overflow:"reject"}); // Establish date from elements, deemed Julian
				this.registerComponents = JulianCalendar.romanUnshift(this.julianClockwork.cbcceDecompose (myOffset)); // Come back to compound and save it.
	}
	// back to 1-year representation
	if (components.year < 1) components.year = 1 - components.year ;	// return given parameter as initially passed
	if (this.registerComponents.year < 1) {this.registerComponents.year = 1 - this.registerComponents.year; this.registerComponents.era = "B.C."}
		else this.registerComponents.era = "A.D.";

	let isoFields = this.registerDate.getISOFields();
	return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this); // standard return
	}

toDateString (date) { // non standard
	this.updateRegister (date);
	return  this.registerComponents.day + "/" + this.registerComponents.month + "/" 
			+ (this.registerComponents.year) + " " + this.registerComponents.era; 
	}
} // end of calendar class

class WesternCalendar extends Temporal.Calendar {
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
registerDate = Temporal.Date.from ("1582-10-15") // initiated with Anno Domini origin
registerComponents = { era : "N.S.", year : 1582, month : 10, day : 15 }
julianCalendar = new JulianCalendar
gregorianCalendar = new Temporal.Calendar("iso8601")

updateRegister (date) { // if date in parameter is different from last, update internal registers to canonical date given in parameter.
	let myDate = date.withCalendar("iso8601");
	if (!myDate.equals (this.registerDate)) {
		if (Temporal.Date.compare (date, this.switchingDate) >= 0) {// in Gregorian period
			this.registerComponents = myDate.getFields(); // was Object.assign
			// delete registerComponents.calendar;	// avoid complications
			this.registerComponents.era = "N.S.";
			} 
		else { // date components are Julian, declare "A.S." era in place of "A.D." 
			this.registerComponents = myDate.withCalendar(this.julianCalendar).getFields();
			if (this. registerComponents.era == "A.D.") this.registerComponents.era = "A.S.";
		}
		this.registerDate = Temporal.Date.from (myDate, {overflow : "reject"});
	}
}
/*
3. Standard and non-standard methods. Here the fields results strictly from the calendar's rule
*/
era (date) { 
	this.updateRegister (date);
	return this.registerComponents.era 
	}
year (date) {
	this.updateRegister (date);
	return this.registerComponents.year;
	}
month (date) {
	this.updateRegister (date);
	return this.registerComponents.month;
	}
day (date) {
	this.updateRegister (date);
	return this.registerComponents.day;
	}
isLeapYear (date) { // a same year, like 1700, may be leap at the begining, then common...
	this.updateRegister (date);
	let e = this.registerComponents.era, y = (e == "B.C." ? 1 - this.registerComponents.year : this.registerComponents.year) ;
	return 	Chronos.mod (y, 4) == 0 && (e != "N.S." || (Chronos.mod (y, 100) != 0 || Chronos.mod (y, 400) == 0)) // (y % 4 == 0 && (e != "N.S." || (y % 100 != 0 || y % 400 == 0)))
	}
	
dateFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct = Temporal.Date) { 
	var components = { ...askedComponents}, options = {...askedOptions}, testDate;
	// check parameter values
	switch (options.overflow) { // balance value is not implemented
		case undefined : options.overflow = "constrain";  break;
		case "balance" : throw CalendricalErrors.uniplementedOption; break;
		case "constrain" : case "reject" : break;
		default : throw CalendricalErrors.invalidOption;
		}
	if (! Number.isInteger(components.year) || ! Number.isInteger(components.month) || ! Number.isInteger (components.day)) throw CalendricalErrors.nonInteger;
	if (components.year < 1) throw CalendricalErrors.yearUnderflow; 
	switch (components.era) {
		case "A.D.": delete components.era ; // here user does not tell much about date, it is like undefined.
		case "B.C.": case "A.S.": case "N.S.": case undefined: break;
		default : throw CalendricalErrors.invalidEra;
		}
	if (components.month < 1 || components.month > 12) throw CalendricalErrors.invalidMonth;
	if (components.day < 1) throw CalendricalErrors.dayUnderflow;
/*	
If era is unspecied, first compare the Gregorian presentation to the switching date. 
If era specified, the caller knows what he wants, date is analysed following era indication, but result is aligned with present calendar.
If after, confirm "N.S.". If before, mark "A.S."; "B.C."  MUST be specified, negative years are rejected.
If era is specified, "A.S"/"N.S.", analysis is guided by era specified, 
Range error is thrown for any "N.S." date before 1582-10-15.
*/	
	delete components.calendar;		// to avoid attemp to construct a wrong date - not all is implemented

	if (components.era == undefined) {	// era not user-defined, Gregorian transition date assumed
		testDate = Temporal.Date.from (components); // Date.Calendar.dateFromFields was prefered. Here "balance" is not available, hence no control
		if (Temporal.Date.compare (testDate, this.switchingDate) >= 0) {// on or after transition date
			testDate = Temporal.Date.from (components,options);		// new request, with options
			components = testDate.getFields();
			delete components.calendar;	// avoid complications
			components.era = "N.S.";
			//this.registerComponents = this.registerDate.withCalendar("iso8601").getFields();
		} else { // Date without expressed era is before transition date
			components.era = "A.D.";  //for Julian calendar analysis
			testDate = this.julianCalendar.dateFromFields (components, options);
			components = testDate.withCalendar(this.julianCalendar).getFields(); //this.registerComponents = testDate.withCalendar(this.julianCalendar).getFields();
			components.era = "A.S."; 
		}
	}
	else // here the follow user's B.C., A.S. or N.S. indication; A.D. is considered like undefined.
		if (components.era == "N.S.") {
			testDate = Temporal.Date.from (components, options);
			if (Temporal.Date.compare (testDate, this.firstSwitchDate) < 0) throw CalendricalErrors.invalidEra;
			components = testDate.withCalendar("iso8601").getFields(); // this.registerComponents 
			components.era = "N.S.";
		}
		else {
			let savera = components.era;	
			if (components.era == "A.S.") components.era = "A.D.";	// "A.S." is rejected with the plain julian calendar.
			testDate = this.julianCalendar.dateFromFields (components, options);
			components = testDate.withCalendar(this.julianCalendar).getFields(); // this.registerComponents 
			components.era = savera; // retrieve "A.S." if needed
		}
/* finalise: store real date and effective components */	
	this.updateRegister (testDate); // the absolute date and the canonical presentation from testDate

/* Overflow situation was detected during Julian or Gregorian analysis. Test final situation */
	let overflow = // any difference between source and target, due to "constrain" application, or to bad choice of era
		(components.era != undefined && components.era != this.registerComponents.era)
		|| components.year != this.registerComponents.year 
		|| components.month != this.registerComponents.month
		|| components.day != this.registerComponents.day ;
	if (overflow && options.overflow == "reject") throw CalendricalErrors.dayOverflow;
	let isoFields = this.registerDate.getISOFields();
	return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this)//this.registerDate.withCalendar(this);
	}

toDateString (date) { // non standard
	this.updateRegister (date);
		return  this.registerComponents.day + "/" + this.registerComponents.month + "/" 
			+ (this.registerComponents.year) + " " + this.registerComponents.era 
	}
} // end of calendar class