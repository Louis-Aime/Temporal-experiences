/* Chronos: Basic functions for calendrical computations
Character set is UTF-8
Chronos class holds basic values, functions and methods for calendrical computations.
May be used with the legacy Date classical environment, and in the Temporal-style environment
Contents: class Chronos
	Constructor parameters
		calendRule: parameter object for the Cycle Based Calendrical Computation Engine (CBCCE)
		weekdayRule: parameter object for week computations
	Parameter description in comments
	Static
		4 time units: Day, Hour, Minute Second
		Errors specific to these calendrical computations
		Calendrical integer division and modulo operation
		shiftCycle : shifting year-month of week-weekdays descriptions
		isJulianLeapYear (year as a relative integer): this year is a leap year under Julian calendar rules
		isGregorianLeapYear (year as a relative integer): this year is a leap year under Gregorian calendar rules
	Methods
		getObject (quantity) : object containing the elements of the date in the target calendar
			quantity:  a time stamp to be converted into a complete date - an integer number of days or subdivision of days
		getNumber (object) : time stamp computed from the date elements (with possible overflow) corresponding to the date expressed in a the target calendar 
			object: the numeric elements of the expressed date. The object name are those of a part of the param structure	
		getWeekFigures (dayIndex, characDayIndex, year): compute figures of the week calendar elements, following rules given in weekdayRule.
const JulianDayIso
	toJulianDay from ISO fields
	toIsoFields from Julian Day
*/
/* Version M2020-11-22 enhance comments
	M2020-11-12 enhance week rules
	M2020-11-09 enhance
	M2020-11-03 first established as a class
	Sources: Miletus CBCCE 2017-2020 (define the main algorithm, still unchanged)
		Suppress shiftYearStart as method, shiftCycle is enough
		Add const JulianDayIso: convert ISO dates from and to integer Julian Day
*/
/* User should make an instance of JulianDayIso for either Date-style environement (monthBase = 0) or Temporal-style environment (monthBase = 1) */
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
class Chronos 	{	// Essential calendrical computations tools, including the Cycle Based Calendrical Computation Engine or CBCCE
	/** Instantiate Chronos for calendar specific computations. Parameters are: calendar cycle structure, and week cycle structure. 
	 * @param (Object)	calendRule:  the cycle structure and intercalation rules of the calendar (see specific section hereunder)
	 * @param (Object)	weekdayRule: set of parameter for the computation of weekday in this calendar (see specific section hereunder)
	*/
	constructor (calendRule, weekdayRule) {
		this.calendRule = calendRule;
		if (weekdayRule != undefined) {
			this.originWeekday = weekdayRule.originWeekday;
			this.daysInYear = weekdayRule.daysInYear;
			this.weekLength = weekdayRule.weekLength != undefined ? weekdayRule.weekLength : 7 ;
			this.startOfWeek = weekdayRule.startOfWeek != undefined ? Chronos.mod (weekdayRule.startOfWeek, this.weekLength) : 1 ;
			this.characWeekNumber = weekdayRule.characWeekNumber != undefined ? weekdayRule.characWeekNumber : 1 ;
			this.dayBase = weekdayRule.dayBase != undefined ? Chronos.mod (weekdayRule.dayBase, this.weekLength) : 1 ;
			this.weekBase = weekdayRule.weekBase != undefined ? weekdayRule.weekBase : 1; 
		}
	}
	/** Detailed description of parameters for Chronos
	** calendRule: parameter object structure; On instantiation, replace # with numbers or literals.
	 * Example = {
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
	** Non tested constraints: 
	 *	1. 	The cycles and the canvas elements shall be defined from the largest to the smallest
	 *		e.g. four-century, then century, then four-year, then year, etc.
	 *	2. 	The same names shall be used for the "coeff" and the "canvas" properties, otherwise functions shall give erroneous results.
	 *	3.	canvas.month.init is defined, it's the number of the first month in the year (0 with Date, 1 with Temporal)
	** weekdayRule: parameters for week computations in this calendar. If existing, this object has the following fields:
	 * (number, required) originWeekday: weekday number of day index 0. Value is renormalised to 0..weekLength-1.
	 * (function, required) daysInYear: function (year), number of days in year (using relative counting system). With solar calendars, result is 365 or 366.
	 * (number, required) startOfWeek: number of the first day of the week for this calendar, e.g. 0 for Sunday, 1 for Monday etc. Default is 1. Value is renormalised to 0..weekLength-1.
	 * (number) characWeekNumber: number of the week of the characDayIndex. Default is 1.
	 * (number) dayBase: number of the first day in any week. May differ from startOfWeek. used for displaying result. Default is 1.
	 * (number) weekBase: number of the first week in any year. May differ from characWeekNumber. Default is 1.
	 * (number) weekLength: number of days in week. Usage: test alernate weeks. Default is 7.
	 * Non tested constraints: 
	 * 1. characWeekNumber shall be at beginning of year, before any intercalary month or day.
	 * 2. weekLength shall be > 0
	*/
	/** Basic units in milliseconds 
	*/
	static DAY_UNIT = 86400000 
	static HOUR_UNIT = 3600000
	static MINUTE_UNIT = 60000
	static SECOND_UNIT = 1000
	/** Errors that show a misuse of these computations
	*/
	static notANumber = new TypeError ("non numeric value")
	static nonInteger = new TypeError ("non integer value for date field")
	static nonPositiveDivisor = new RangeError ("non positive divisor in calendrical division")
	static cycleShifting = new RangeError ("out-of-range phase value in cycle")
	/** modulo function for calendrical computations
	 * @param (number) a: dividend, positive or negative
	 * @param (number) d: divisor, must be strictly positive or error is thrown
	 * @return (number) modulo of a divided by d, with 0 <= modulo < d
	*/
	static mod (a, d) {		//same sign as d, not as a. You may check negative value of didivend, e.g. of years
		if (Array.from(arguments).some(isNaN)) throw Chronos.notANumber;
		if (d <= 0) throw Chronos.nonPositiveDivisor;
		return ( a*Math.sign(d) >= 0 ? a % d : (a % d + d) % d)
	}
	/** division with modulo for calendrical computations
	 * @param (number) a: dividend, positive or negative
	 * @param (number) d: divisor, must be strictly positive or error is thrown
	 * @return (Array) [quotient, modulo] with 0 <= modulo < d
	*/
	static divmod (a, d) {
		if (Array.from(arguments).some(isNaN)) throw Chronos.notANumber;
		if (d <= 0) throw Chronos.nonPositiveDivisor;
		let quotient = 0, modulo = a;
		while (modulo < 0) {
			--quotient;
			modulo += d;
		}
		while (modulo >= d) {
			++quotient;
			modulo -= d;
		}
		return [ quotient, modulo ]
	}
	/** Cycle start shifting, keeping phase measure. Example : (20, 1) shifted by 2 in a 12-cycle with base 1 yields (19, 13), but (20, 6) yields (20, 6)
		This operation is used for calendrical computations on Julian-Gregorian calendars (shift year start to March), but also for computations on weeks.
	 * @param (number) cycle: the rank of cycle, which is increased by 1 each time 'phase' reaches (mod (cycleBase, period))
	 * @param (number) phase: indicates the phase within the cycle, e.g. for the month or the day of week. (phase == cycleBase) means the start of a new cycle.
	 * @param (number) period: the cycle's period, typically 12 or 7 for calendrical computations, but may also be the moon's month mean duration in milliseconds.
	 * @param (number) shift: the number of units for shifting. After shifting, cycleBase is cycleBase + shift.
	 * @param (number) cycleBase: which phase is that of a new cycle, in the parameter [cycle, phase] representation. O by default (like month representation with Date objects).
	 * @return (Array) [returnCycle, returnPhase] with: (returnCycle * period + returnPhase == cycle * period + phase) && (shift + cycleBase) <= returnPhase < (shift + cycleBase)+period
	*/
	static shiftCycle (cycle, phase, period, shift, cycleBase=0) {
		if (Array.from(arguments).some(isNaN)) throw Chronos.notANumber;
		if (phase < cycleBase || phase >= cycleBase + period) throw Chronos.cycleShifting;
		return Chronos.divmod (cycle * period + phase - cycleBase - shift, period).map
				((value, index) => (index == 1 ? value + cycleBase + shift : value) )
	}
	/** Whether a year is a leap year in the Julian calendar, with the year origin Anno Domini as defined by Dionysius Exiguus in the 6th century. 
	 * @param (number) a signed integer number representing the year. 0 means 1 B.C. and so on. Leap years, either positive or negative, are divisible by 4.
	 * @return (boolean) true if year is a leap year i.e. there is a 29 February in this year.
	 */
	static isJulianLeapYear (year) {
		return Chronos.mod (year, 4) == 0
	}
	/** Whether a year is a leap year in the Gregorian calendar, with the year origin Anno Domini as defined by Dionysius Exiguus in the 6th century. 
	 * @param (number) a signed integer number representing the year. 0 means 1 B.C. Leap years, are either not divisible by 100 but by 4, or divisible by 400.
	 * @return (boolean) true if year is a leap year i.e. there is a 29 February in this year.
	 */
	static isGregorianLeapYear (year) {
		return Chronos.mod (year, 4) == 0 && (Chronos.mod(year, 100) != 0 || Chronos.mod(year, 400) ==0)
	}
	/** Build a compound object from a time stamp holding the elements as required by a given cycle hierarchy model.
	 * @param {number} askedNumber: a time stamp representing the date to convert.
	 * @returns {Object} the calendar elements in the structure that calendRule prescribes.
	*/
	getObject (askedNumber) {
	  if (isNaN (askedNumber)) throw Chronos.notANumber;
	  let quantity = askedNumber - this.calendRule.timeepoch; // set at initial value the quantity to decompose into cycles.
	  var result = new Object(); // Construct initial compound result 
	  for (let i = 0; i < this.calendRule.canvas.length; i++) 	// Define property of result object (a date or date-time)
		Object.defineProperty (result, this.calendRule.canvas[i].name, {enumerable : true, writable : true, value : this.calendRule.canvas[i].init}); 
	  let addCycle = 0; 	// flag that upper cycle has one element more or less (i.e. a 5 years franciade or 13 months luni-solar year)
	  for (let i = 0; i < this.calendRule.coeff.length; ++i) {	// Perform decomposition by dividing by the successive cycle length
		if (isNaN(quantity)) 
			result[this.calendRule.coeff[i].target] = NaN	// Case where time stamp is not a number, e.g. out of bounds.
		else {
			let r = 0; 		// r is the computed quotient for this level of decomposition
			if (this.calendRule.coeff[i].cyclelength == 1) r = quantity // avoid performing a trivial division by 1.
			else {		// at each level, search at the same time the quotient (r) and the modulus (quantity)
			  while (quantity < 0) {
				--r; 
				quantity += this.calendRule.coeff[i].cyclelength;
			  }
			  let ceiling = this.calendRule.coeff[i].ceiling + addCycle;
			  while ((quantity >= this.calendRule.coeff[i].cyclelength) && (r < ceiling)) {
				++r; 
				quantity -= this.calendRule.coeff[i].cyclelength;
			  }
			  addCycle = (r == ceiling) ? this.calendRule.coeff[i].subCycleShift : 0; // if at last section of this cycle, add or subtract 1 to the ceiling of next cycle
			}
			result[this.calendRule.coeff[i].target] += r*this.calendRule.coeff[i].multiplier; // add result to suitable part of result array	
		}
	  }	
	  return result;
}
	/** Compute the time stamp from the element of a date in a given calendar.
	 * @param {Object} askedObject: the numeric elements of the date, collected in an object containing the elements that calendRule prescribes.
	 * @param {Object} this.calendRule: the representation of the calendar structure and its connection to the time stamp.
	 * @returns {number} the time stamp
	*/
	getNumber (askedObject) { // from an object askedObject structured as calendRule.canvas, compute the chronological number
		var cells = {...askedObject}, quantity = this.calendRule.timeepoch; // initialise Unix quantity to computation epoch
		for (let i = 0; i < this.calendRule.canvas.length; i++)  // cells value shifted as to have all 0 if at epoch
			cells[this.calendRule.canvas[i].name] -= this.calendRule.canvas[i].init;
		let currentTarget = this.calendRule.coeff[0].target; 	// Set to uppermost unit used for date (year, most often)
		let currentCounter = cells[this.calendRule.coeff[0].target];	// This counter shall hold the successive remainders
		let addCycle = 0; 	// This flag says whether there is an additional period at end of cycle, e.g. a 5th year in the Franciade or a 13th month
		for (let i = 0; i < this.calendRule.coeff.length; i++) {
			let f = 0;				// Number of "target" values (number of years, to begin with)
			if (currentTarget != this.calendRule.coeff[i].target) {	// If we go to the next level (e.g. year to month), reset variables
				currentTarget = this.calendRule.coeff[i].target;
				currentCounter = cells[currentTarget];
			}
			let ceiling = this.calendRule.coeff[i].ceiling + addCycle;	// Ceiling of this level may be increased 
																// i.e. Franciade is 5 years if at end of upper cycle
			while (currentCounter < 0) {	// Compute f, number of cycles of this level. Cells[currentTarget] may hold a negative figure.
				--f;
				currentCounter += this.calendRule.coeff[i].multiplier;
			}
			while ((currentCounter >= this.calendRule.coeff[i].multiplier) && (f < ceiling)) {
				++f;
				currentCounter -= this.calendRule.coeff[i].multiplier;
			}
			addCycle = (f == ceiling) ? this.calendRule.coeff[i].subCycleShift : 0;	// If at end of this cycle, the ceiling of the lower cycle may be increased or decreased.
			quantity += f * this.calendRule.coeff[i].cyclelength;				// contribution to quantity at this level.
		}
		return quantity ;
	}
	/**	Compute week figures in the most common situation of solar calendar (365-366 days) using the regular 7 days week. 
	 * @param (number) dayIndex : day stamp, in day unit, of the day whose figures are computed
	 * @param (number) characDayIndex : day stamp of the characteristic day, the day that belongs to week number characWeekNumber in same year
	 * @param (number) year : the relative year the dayIndex date belongs to
	 * @return (Array) 
		0 : week number
		1 : week day number, depending on dayBase. Modulo this.weekLength value is always : 0 (or this.weekLength) for Sunday of first day, 1 for Monday etc.
		2 : year offset: -1 if week belongs to last week year, 0 if in same year, 1 if in next year.
		3 : weeks in year: number of weeks for the week year the date belongs to. 52 or 53. This is not the number of the last week (check this.weekBase)!
	*/
	getWeekFigures (dayIndex, characDayIndex, year) {
		let weekNumberShift = this.weekBase - 1, 	// used to compute last week's number
			[weeksInYear, weekShiftNextYear] = Chronos.divmod (this.daysInYear(year), this.weekLength),	// Integer division of calendar year in weeks. 
			// criticalWYP = Chronos.mod (-weekShiftNextYear, this.weekLength),	for memory: if weekYearPhase reaches this value, this week year has one week in addition to integer weeks.
			weekYearPhase = Chronos.mod (characDayIndex + this.originWeekday - this.startOfWeek, this.weekLength); 	// this figures characterises the week year, in particular versus number of weeks.
			// referenceDayIndex = characDayIndex - this.startOfWeek - weekYearPhase;			// index of day from which week figures should be computed.
		// Compute basic coordinates: week cycle number (base 0) from referenceDay, day number 0..this.weekLength-1 in week beginning at 0 then shift to this.startOfWeek.
		var result = Chronos.divmod ( dayIndex - characDayIndex + this.startOfWeek + weekYearPhase, this.weekLength ); // Here, first week is 0 and first day of week is 0.
		result[0] += this.characWeekNumber;		// set week number with respect to number of week of the reference day
		result = Chronos.shiftCycle ( result[0], result [1], this.weekLength, this.startOfWeek );	// shift week cycle, first day is this.startOfWeek and last day is this.startOfWeek + this.weekLength-1
		if (this.dayBase != this.startOfWeek) result[1] = Chronos.mod (result[1]-this.dayBase, this.weekLength) + this.dayBase;		// day number forced to range this.dayBase .. this.dayBase + this.weekLength-1;
		// Solve overflow
		let WeeksInDateYear = weeksInYear + (weekYearPhase >= Chronos.mod (-weekShiftNextYear, this.weekLength) ? 1 : 0) ; // Number of weeks for present week year
		if (result[0] < this.weekBase) { // The week belongs to the preceding weekyear
			[weeksInYear, weekShiftNextYear] = Chronos.divmod (this.daysInYear(year-1), this.weekLength);	// recompute week year parameters for preceding year
			result.push(-1,		// reference year for the week number is the year before the date's year
				Chronos.mod (weekYearPhase - weekShiftNextYear, this.weekLength) >= Chronos.mod (-weekShiftNextYear, this.weekLength)	// weekYearPhase of preceding year computed after this year's
					? weeksInYear + 1 : weeksInYear );	// Number of weeks in the preceding year
			result[0] = result[3] + weekNumberShift;	// Set to last week of preceding year
		} else if (result[0] > WeeksInDateYear + weekNumberShift) {	// The week belongs to the following year
			let [ weeksInYearPlus, weekShiftNextYearPlus ] = Chronos.divmod (this.daysInYear(year+1), this.weekLength);	// Integer division of next calendar year in weeks
			result.push (1, 	// reference year for the week number is the year after the date's year
				Chronos.mod (weekYearPhase + weekShiftNextYear, this.weekLength) >= Chronos.mod (-weekShiftNextYearPlus, this.weekLength) 	// weekYearPhase cycle of next year computed from this year's
					?  weeksInYearPlus + 1 : weeksInYearPlus);		// Number of weeks in the next wwek year
			result[0] = this.weekBase;				// set to first week
		} else result.push (0, WeeksInDateYear); 	// most cases.
		return result
	}
} // end of Chronos class
class JulianDayIso { // Base functions for Temporal computations and iso8601 week computions. Instantiate with suitable monthBase (0 -> legacy date, 1 -> Temporal)
	/**	Conversion routines between integer Julian Day number and date expressed in ISO format with isoYear, isoMonth, isoDay. User may choose the base for month number.
	@param (number) monthBase : number for January, the first month. 0 for direct use with Date object, 1 for use with Temporal or with Miletus ExtDate and ExtDateTimeFormat.
	*/
	constructor (monthBase) {
		this.monthBase = monthBase;	// value of the first month, 0 for "Date" style, 1 for "Temporal" style
		this.clockwork = new Chronos ({
			timeepoch : 1721120, // Julian Day for ISO 0000-03-01
			coeff : [ 
			  {cyclelength : 146097, ceiling : Infinity, subCycleShift : 0, multiplier : 400, target : "isoYear"},
			  {cyclelength : 36524, ceiling :  3, subCycleShift : 0, multiplier : 100, target : "isoYear"},
			  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "isoYear"}, // 4 Julian years
			  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "isoYear"}, // One 365-days year
			  {cyclelength : 153, ceiling : Infinity, subCycleShift : 0, multiplier : 5, target : "isoMonth"}, // Five-months cycle
			  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "isoMonth"}, // 61-days bimester
			  {cyclelength : 31, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "isoMonth"}, // 31-days month
			  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "isoDay"}
			],
			canvas : [ 
				{name : "isoYear", init : 0},
				{name : "isoMonth", init : this.monthBase + 2}, 
				{name : "isoDay", init : 1}
			]
			}, {	// weekdayRule characteristics for iso8601 
				originWeekday: 1, // Julian Day 0 is a Monday.
				daysInYear: (year) => (Chronos.isGregorianLeapYear(year) ? 366 : 365),
				// take default values of the other fields
			}
		)
	}
	/** Compute Julian Day, an integer number for the date specified under ISO 8601. Julian Day 0 is -004713-11-24, or Monday 1 Jan. 4713 B.C. (julian calendar).
	 * @param (Object): fields isoYear, isoMonth and isoDay must be specified as integer. isoMonth must lay in range 0..11 or 1..12, depending on monthBase specified at construction. 
		if day is out of range of valid days for the month, date is balanced to the number of days out of the range.
	 * @return (number): the Julian Day, an integer number meaning precisely this date à 12:00 UTC.
	*/
	toJulianDay = function ( isoFields ) {	// Julian Day (at noon UTC) from object containing isoYear, isoMonth, isoDay
		let myFields = {...isoFields};
		[myFields.isoYear, myFields.isoMonth] = Chronos.shiftCycle (isoFields.isoYear, isoFields.isoMonth, 12, 2, this.monthBase);
		return this.clockwork.getNumber (myFields)
	}
	/** Compute ISO8601 date figures from an integer Julian Day. Julian Day 0 is -004713-11-24, or Monday 1 Jan. 4713 B.C. (julian calendar).
	 * @param (number): the Julian Day, an integer number meaning precisely this date à 12:00 UTC.
		if day is out of range of valid days for the month, date is balanced to the number of days out of the range.
	 * @return (Object): fields isoYear, isoMonth and isoDay specify the date in ISO8601 calendar. isoMonth lays in range 0..11 or 1..12, depending on monthBase specified at construction.
	*/
	toIsoFields = function ( julianDay ) {	// Build compound ISO fields (at noon UTC) from a julian day
		if (isNaN (julianDay) ) throw notANumber;
		let myFields = this.clockwork.getObject (julianDay);
		[myFields.isoYear, myFields.isoMonth] = Chronos.shiftCycle (myFields.isoYear, myFields.isoMonth, 12, -2, this.monthBase+2);
		return myFields
	}
	/** Compute the week coordinates under ISO8601 rules for the date represented by the Julian Day.
	 * @param (number) Julian Day that represents the date
	 * @return (Object) 
			weekYearOffset: add to isoYear to get the week year number (-1/0/1).
			weekNumber: number of the week, 1..53 (only a few years have 53 weeks).
			weekDay: number of the day of week, 1 for Monday, 7 for Sunday.
			weeksInYear: number of weeks for this week year. This applies to the week year the date belongs to, not the isoYear.
	*/
	toIsoWeekFields = function ( julianDay ) { // ISO week coordinates from a Julian Day.
		if (isNaN (julianDay) ) throw notANumber;
		let myFields = this.toIsoFields (julianDay);
		myFields.isoMonth = this.clockwork.calendRule.canvas[1].init - 2; myFields.isoDay = this.clockwork.calendRule.canvas[2].init + 3; 	// 4 January
		let myFigures = this.clockwork.getWeekFigures (julianDay, this.toJulianDay ( myFields ), myFields.isoYear);
		return {weekYearOffset : myFigures[2], weekNumber : myFigures[0], weekday : myFigures[1], weeksInYear : myFigures[3]}
	}
}
