/* A selection of calendar for tries with Temporal
*/
/* Version	M2021-05-25	Several changes in Temporal polyfill:
		suppress "Construct" field
	M2021-02-30 After the change of code for eras of the gregory calendar: 
		develop a monthCode method
		use "e0", "e1", "e2" as era codes, where "e0" means that years are counted backwards starting with 1 before epoch (1-y style)
		establish mergeFields(), update fields()
		update consistency tests of input data for dateFromFields
		update daysInMonth, daysInYear, dayOfYear: make computation at construction and simplify run-time computing
		add a "swiss" calendar where switching date is 1701-01-12 (no 1 Jan. this year in Switzerland)
	M2021-02-09	waiting for first implementation of all ICU https://github.com/tc39/proposal-temporal/pull/1245
	M2021-02-03	New Temporal, no date.getFields, enforce year / eraYear fields
	M2020-01-19 Adapt to newer version of chronos.js, file names in lowercase
	M2020-12-28 JulianCalendar.shiftYearStart as static method
	M2020-11-26 - handle options at date initialisation, care for "compare" which requires egality in calendar in order to yield "0"
	M2020-11-25 suppress registers, do not memorise former date computations.
	M2020-11-23 - all calendars defined in the same file. Do not subclass basic calendars. Personal toDateString enhanced. Subtract method suppressed. No time method (no harm)
*/
/* Version note
New Temporal (https://github.com/tc39/proposal-temporal/pull/1245) checks year vs [era, eraYear] fields, and wants a function for .era, .eraYear and .monthCode
See also https://github.com/tc39/proposal-temporal/... #1231, #1235, #1306, #1307, #1308, #1310
monthCode is added to month.
year and eraYear are 2 possible fields date fields given by the calendar reckoning system. 
	year is the algebraic signed integer value of the year, without hole, used in all computations,
	whereas eraYear denotes the integer value associated with an era indication.
For calendars with eras, the code "e0", "e1" and possibly "e2" are used.
*/
/* Required: 
	Chronos.js
		class Chronos
		class WeekClock
		class IsoCounter
	Temporal environment
*/
/* Copyright Miletus 2020-2021 - Louis A. de FOUQUIERES
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
const JDISO = new IsoCounter (-4713, 11, 24);		// Julian Day to ISO fields and the reverse
	 
const isoWeeks = {	// The week fields with the ISO rules
	isoWeekClock : new WeekClock ({
		originWeekday: 1, 	// Julian Day 0 is a Monday
		daysInYear: year => Chronos.isGregorianLeapYear(year) ? 366 : 365	// Function that yields the number of days in a given year
		// All other fields are defaulted to efficient values for ISO
	}),
	fullFieldsFromDate (date) {	// compute all fields that characterise this date in this calendar, including week fields.
		var // index = JDISO.toCounter (date.getISOFields()),
			fullFields = date.getISOFields();
		fullFields.year = fullFields.isoYear; fullFields.month = fullFields.isoMonth; fullFields.day = fullFields.isoDay;
		fullFields.fullYear = fullFields.year;
		[fullFields.weekOfYear, fullFields.dayOfWeek, fullFields.weekYearOffset, fullFields.weeksInYear] = this.isoWeekClock.getWeekFigures 
			(JDISO.toCounter(fullFields), JDISO.toCounter({ isoYear : fullFields.year, isoMonth : 1, isoDay : 4 }), fullFields.year);
	return fullFields;
	}
}

class MilesianCalendar {
/** Constructor for the Milesian calendar
 * @param (string) id : the name when displaying an ISO string
*/
	constructor (id) {
		this.id = id;
	}
	/* Errors
	*/
	static missingElement = new TypeError ("missing date element")
	static ambiguousElement = new TypeError ("ambiguous date elements")
	static missingOption = new TypeError ("expected option missing")
	static invalidOption = new RangeError ("unknown option")
	static dateOverflow = new RangeError ("invalid date") // thrown in case of overflow : reject option
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	toString () {return this.id}
	toJSON ()  {return this.id}
	fields (theFields) {return theFields} // nothing to add to the standard fields year, month, monthCode, day
	mergeFields (fields, additionalFields) {	// additional fields should replace fields if existing
		let returnFields = {...fields }; 	// prepare return value
		if (additionalFields.monthCode != undefined && additionalFields.month != undefined) throw MilesianCalendar.ambiguousElement; // Checked by Temporal objects ?
		if (additionalFields.monthCode != undefined) delete returnFields.month;
		if (additionalFields.month != undefined) delete returnFields.monthCode;
		return Object.assign(returnFields, additionalFields)
	}
	static from (thing) {return Temporal.Calendar.from(thing)}	// This should not be used, but just in case.
	/* Basic calendar-specific objects 
	*/
	calendarClockwork = new Chronos ( { // To be used with day counter from M000-01-01 ie ISO -000001-12-22. Decompose into Milesian year, month, day.
		timeepoch : 1721050, // Julian Day at 1 1m 000 i.e. -000001-12-22
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
			{name : "year", init: 0},
			{name : "month", init: 1},
			{name : "day", init : 1}
		]
	})	// end of calendRule
	weekClockWork = new WeekClock ( {	// weekdayRule
		originWeekday: 4, 		// Use day part of Posix timestamp, week of day of 1970-01-01 is Thursday
		daysInYear: (year) => (Chronos.isGregorianLeapYear( year + 1 ) ? 366 : 365),		// leap year rule for Milesian calendar
		startOfWeek : 0,		// week start with 0
		characWeekNumber : 0,	// we have a week 0 and the characteristic day for this week is 7 1m.
		dayBase : 0,			// use 0..6 display for weekday
		weekBase : 0,			// number of week begins with 0
		weekLength : 7			// the Milesian week is the 7-days well-known week
	})	// end of weekClockWork
	static internalDaysInMonth (month, isLeap) { // Milesian calendar version. You just tell whether year is leap or not.
		return (month % 2 == 1 
					? 30 
					: (month < 12 
						? 31 
						: isLeap ? 31 : 30 ));
	}
	fieldsFromDate (date) {	// compute essential fields for  this calendar, after isoFields of any date. Week fields computed separately, on demand.
		return this.calendarClockwork.getObject(JDISO.toCounter (date.getISOFields()))	// since there is no era
	}
	fullFieldsFromDate (date) {	// compute all fields that characterise this date in this calendar, including week fields.
		var index = JDISO.toCounter (date.getISOFields()),
			fullFields = this.calendarClockwork.getObject(index);
		[fullFields.weekOfYear, fullFields.dayOfWeek, fullFields.weekYearOffset, fullFields.weeksInYear] = this.weekClockWork.getWeekFigures 
			(index, this.calendarClockwork.getNumber({ year : fullFields.year, month : 1, day : 7 }), fullFields.year);
		return fullFields;
	}
	/* Main date and Temporal objects generator from fields representing a Milesian date. 
	 Note that the Temporal. object shall be initiated with the ISO representation.
	*/ 
	dateFromFields (askedComponents, options) { // = {overflow : "constrain"} necessary when this routine is called by Temporal's other (dateAdd) ?
		var components = { ... askedComponents }; 
		// Temporal initialises and checks options parameter
		// Temporal throws non-numeric values for date parameters
		// Temporal checks completeness
		// Check how month is specified. Priority to existing numeric month. Else, extract month number by any means
		if (isNaN(components.year)) throw MilesianCalendar.missingElement;
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw MilesianCalendar.missingElement;
		// First constrain month. If outside 1..12, set to first resp. last day of year.
		if (components.month < 1) if (options.overflow == "constrain") { components.month = 1; components.day = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.month > 12) if (options.overflow == "constrain") { 
				components.month = 12; 
				components.day = MilesianCalendar.internalDaysInMonth ( 12, Chronos.isGregorianLeapYear(components.year + 1) )
			} 
			else throw MilesianCalendar.dateOverflow;
		// Now, month is in good range, constrain day
		if (isNaN(components.day)) throw MilesianCalendar.missingElement;
		if (components.day < 1) if (options.overflow == "constrain") { components.day = 1 } else throw MilesianCalendar.dateOverflow;
		let upperDay = MilesianCalendar.internalDaysInMonth ( components.month, Chronos.isGregorianLeapYear(components.year + 1) );
		if (components.day > upperDay) if (options.overflow == "constrain") { components.day = upperDay } else throw MilesianCalendar.dateOverflow;
		// compute day index from elements, compute isoFields and return.
		let isoFields = JDISO.toIsoFields (this.calendarClockwork.getNumber(components));
		return new Temporal.PlainDate (...isoFields);
	}
	yearMonthFromFields (askedComponents, options) { // options = {overflow : "constrain"}
		var components = { ... askedComponents }; 
		if (isNaN(components.year)) throw MilesianCalendar.missingElement;
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw MilesianCalendar.missingElement;
		if (components.month < 1) if (options.overflow == "constrain") { components.month = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.month > 12 ) if (options.overflow == "constrain") { components.month = 12 } else throw MilesianCalendar.dateOverflow;
		return new Temporal.PlainYearMonth (...components);	// Year and month for that day is always the same in Milesian and ISO 8601
	}
	monthDayFromFields (askedComponents, options) { // options = {overflow : "constrain"}
		var components = { ... askedComponents };
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw MilesianCalendar.missingElement;
		if (components.month < 1) if (options.overflow == "constrain") { components.month = 1; components.day = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.month > 12 ) if (options.overflow == "constrain") { components.month = 12;  components.day = 31 } 
			else throw MilesianCalendar.dateOverflow;
		if (isNaN(components.day)) throw MilesianCalendar.missingElement;
		if (components.day < 1) if (options.overflow == "constrain") { components.day = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.day > 31 || ( components.day == 31 && Chronos.mod (components.month, 2) == 1 ))  
			if (options.overflow == "constrain") { components.day = 30 + (Chronos.mod (components.month, 2) == 0 ? 1 : 0) } else throw MilesianCalendar.dateOverflow;
		components.year = (components.month == 12 && components.day == 31) ? 1999 : 2000;	// Long cycle between 31 12m N-1 and 30 12m N, where N is a bissextile year number.
		let myFields = this.dateFromFields(components, options).getISOFields();
		return new Temporal.PlainMonthDay (...myFields);
	}
	/* Methods for elements of date
	*/
	era (date) {return undefined}
	eraYear (date) {return undefined}
	year (date) { return this.fieldsFromDate(date).year }
	month (date) { return this.fieldsFromDate(date).month }
	monthCode (date) {return this.fieldsFromDate(date).month + "m"}
	day (date) { return this.fieldsFromDate(date).day }
	daysInWeek (date) {return 7}
	dayOfWeek (date) { return this.fullFieldsFromDate(date).dayOfWeek }
	daysInYear (date){ return (this.inLeapYear(date) ? 366 : 365) }
	dayOfYear (date) { 
		let fields = this.fieldsFromDate(date), m = fields.month - 1;
		return fields.day + 30*(m % 2) + 61*Math.floor (m/2)
	}
	weekOfYear (date) { return this.fullFieldsFromDate(date).weekOfYear } 
	daysInMonth (date) { 
		let fields = this.fieldsFromDate(date), m = fields.month - 1;
		return m % 2 == 0 ? 30 : ( m == 11 && ! Chronos.isGregorianLeapYear (fields.year + 1) ? 30 : 31)
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) { return Chronos.isGregorianLeapYear (this.fieldsFromDate(date).year + 1) }
	/* Non standard week properties 
	*/
	weeksInYear (date) { return this.fullFieldsFromDate(date).weeksInYear }
	yearOfWeek (date)	{	// Proposal. Year in the week's calendar corresponding to weekOfYear of the date
		let fields = this.fullFieldsFromDate(date);
		return fields.year + fields.weekYearOffset
	}
	/* Methods for use with Duration.
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in targer month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final targer date.
	*/
	dateAdd (date, duration, options) {// Add a +/- duration - // no default value options={overflow:"constrain"}
		// 1. Build new date components from duration years and months
		let components = this.fieldsFromDate(date),
			addedYearMonth = Chronos.divmod ( components.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		// dateFromFields shall handle overflow option
		let dateOne = this.dateFromFields (components, options);
		// 2. Add or subtract days to first step result
		let resultFields = JDISO.toIsoFields(JDISO.toCounter(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Temporal.PlainDate (...resultFields);
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) { //
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // throw MilesianCalendar.invalidOrder; break;
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration.from("P0D"); break;
			case -1 :
				let myLarger = { year : larger.year, month : larger.month, day : larger.day },
					mySmaller = { year : smaller.year, month : smaller.month, day : smaller.day },
					myDayOffset = this.calendarClockwork.getNumber(myLarger) - this.calendarClockwork.getNumber(mySmaller),
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
				switch (options.largestUnit) {
					case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
					case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
					case "weeks" : 
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek);
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case undefined : case "auto"  : 
					case "days" : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw MilesianCalendar.invalidOption
				}
			break; // just to close case -1
		}
	}
	toDateString (date) { // non standard display method
		let fields = this.fullFieldsFromDate(date);
		let absYear = Math.abs(fields.year);
		return  "[" + this.id + "] " 
			+ fields.day + " " + fields.month + "m " 
			+ ((fields.year < 0) ? "-": "") 
			+ ((absYear < 100) ? "0" : "") + ((absYear < 10) ? "0" : "") + absYear; 
		}
} // end of calendar object/class

class JulianCalendar  {
/**	Constructor fo julian calendar variants
 * @param (string) id : the calendar name
 * @param (number) startOfWeek : week begins on Sunday (0) or on Monday (1) or any other day (0 to 6).
 * @param (number) w1Day : the day in the first month that is always in the week 1 of year, default 4 meaning 4 January.
*/
	constructor (id, startOfWeek=0, w1Day=4) {
		this.startOfWeek = startOfWeek;
		this.w1Day = w1Day;	// the day number in January that characterises the first week, 4 by default.
		this.id = id;
	}
	/* Errors
	*/
	static missingElement = new TypeError ("missing date element")
	static ambiguousElement = new TypeError ("ambiguous date elements")
	static missingOption = new TypeError ("expected option missing")
	static invalidOption = new RangeError ("unknown option")
	static dateOverflow = new RangeError ("invalid date") // thrown in case of overflow : reject option
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	toString () {return this.id}
	toJSON ()  {return this.id}
	fields (theFields) {	// Add era and eraYear if year is in list
		if (theFields.includes('year')) {
			theFields.push ('eraYear');
			theFields.push ('era')
		}
		return theFields
	}
	mergeFields (fields, additionalFields) {	// monthCode converted to month ; [era, eraYera] shall throw [year] out
		let returnFields = {...fields }; 	// prepare return value
		if (additionalFields.monthCode != undefined && additionalFields.month != undefined) throw JulianCalendar.ambiguousElement; // Checked by Temporal objects ?
		if (additionalFields.monthCode != undefined) delete returnFields.month;
		if (additionalFields.month != undefined) delete returnFields.monthCode;
		if ((additionalFields.eraYear != undefined) != (additionalFields.era != undefined)) throw JulianCalendar.missingElement; // Checked by Temporal objects ?
		if (additionalFields.year != undefined && additionalFields.eraYear != undefined) throw JulianCalendar.ambiguousElement; // Checked by Temporal objects ?
		if (additionalFields.year != undefined) { delete returnFields.eraYear; delete returnFields.era };
		if (additionalFields.eraYear != undefined ) delete returnFields.year;
		return Object.assign(returnFields, additionalFields)
	}
	eras = ["e0", "e1"]	// basic codes for eras should always be in small letters
	/* Basics data and computing options
	*/
	calendarClockwork = new Chronos ({ // To be used with day counter from Julian 0000-03-01 ie ISO 0000-02-28. Decompose into Julian years, months, date.
		timeepoch : 1721118, // Julian day of 1 martius 0 i.e. 0000-02-28
		coeff : [ 
		  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "year"}, // 4 Julian years
		  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "year"}, // One 365-days year
		  {cyclelength : 153, ceiling : Infinity, subCycleShift : 0, multiplier : 5, target : "month"}, // Five-months cycle
		  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"}, // 61-days bimester
		  {cyclelength : 31, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "month"}, // 31-days month
		  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
		],
		canvas : [ 
			{name : "year", init : 0},	// year is a signed integer, 0 meaning 1 B.C.
			{name : "month", init : 3}, // Shifted year begins with month number 3 (March), thus simplify month shifting
			{name : "day", init : 1}
		]
		}) // end of calendRule
	weekClockWork = new WeekClock ( {	// weekdayRule
		originWeekday: 1, 		// weekday of Julian Day 0 is Monday
		daysInYear: (year) => (Chronos.isJulianLeapYear( year ) ? 366 : 365),		// leap year rule for this calendar
		startOfWeek : this.startOfWeek,		// week starts with 0 (Sunday) or 1 (Monday) or any other day as specified
		characWeekNumber : 1,	// we have a week 1 and the characteristic day for this week is (w1Day) January. Little change with respect to ISO.
		dayBase : 1,			// use 1..7 display for weekday
		weekBase : 1,			// number of week begins with 1
		weekLength : 7			
	}) // end of weekClock
	static shiftYearStart (dateFields, shift, base) { // Shift start of year to March, or back to January, for calendrical calculations
		let shiftedFields = {...dateFields};
		[ shiftedFields.year, shiftedFields.month ] = Chronos.shiftCycle (dateFields.year, dateFields.month, 12, shift, base + 1);
		return shiftedFields
	}
	static internalDaysInMonth (month, isLeap) { // May be used for Julian or Gregorian calendar, you just tell whether year is leap year or not.
		return (month - Math.floor(month / 8)) % 2 == 1 
					? 31 
					: (month > 3 
						? 30 
						: isLeap ? 29 : 28 );
	}
	static checkYearFields (components, BCEra) {	// Check that fields are complete and do not contradict each other, establish .year. Only the BC era is checked.
		if ( (components.year == undefined) 
			&& (components.eraYear == undefined || components.era == undefined) ) 
			throw JulianCalendar.missingElement; // year must be defined in some way
		if (components.era == undefined && components.eraYear != undefined) throw JulianCalendar.ambiguousElement;	// if era not defined, eraYear should not be used
		if ( components.year != undefined && components.eraYear != undefined && 
			components.year != components.eraYear && (components.era != BCEra || components.year != 1 - components.eraYear) )
			throw JulianCalendar.ambiguousElement;	// Year indications contradict each other
		if (components.year == undefined) components.year = components.era == BCEra ? 1 - components.eraYear : components.eraYear;
		return true
	}
	fieldsFromDate (date) {	// compute essential fields for  this calendar, after isoFields of any date. Week fields computed separately, on demand.
		var fields = JulianCalendar.shiftYearStart(this.calendarClockwork.getObject(JDISO.toCounter (date.getISOFields())),-2,2);	// numeric fields, with algebraic year
		[ fields.era, fields.eraYear ] = fields.year < 1 ? [ this.eras[0], 1 - fields.year ]: [ this.eras [1], fields.year ];
		return fields;
	}
	fullFieldsFromDate (date) {	// compute all fields that characterise this date in this calendar, including week fields.
		var index = JDISO.toCounter (date.getISOFields()),
			fullFields = JulianCalendar.shiftYearStart(this.calendarClockwork.getObject(index),-2,2) ;
		[ fullFields.era, fullFields.eraYear ] = fullFields.year < 1 ? [ this.eras[0], 1 - fullFields.year ]: [ this.eras [1], fullFields.year ];
		[fullFields.weekOfYear, fullFields.dayOfWeek, fullFields.weekYearOffset, fullFields.weeksInYear] = this.weekClockWork.getWeekFigures 
			(index,  this.calendarClockwork.getNumber(JulianCalendar.shiftYearStart({ year : fullFields.year, month : 1, day : this.w1Day },2,0)), fullFields.year);
		return fullFields;
	}
	/* Main date and Temporal objects generator from fields representing a Julian date. 
	 Note that the Temporal.xxxDatexxx object shall be initiated with the ISO representation.
	*/ 
	dateFromFields (askedComponents, options={overflow : "constrain"}) { // options = {overflow : "constrain"} necessary
		var components = { ...askedComponents }; 
		// check parameter values
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw JulianCalendar.ambiguousElement;
		// Check that all necessary fields are present and do not contradict each other. user may either submit era and eraYear, or submit year as a relative number, without era
		if ( !JulianCalendar.checkYearFields (components, this.eras[0]) ) throw JulianCalendar.ambiguousElement; 	// This solves the year field
		// Check for valid era in this specific calendar
		if (components.era != undefined && !this.eras.includes(components.era)) throw JulianCalendar.outOfRangeDateElement;
		// check data agains overflow option, constrain or reject for each overflow case.
		if (components.month < 1) if (options.overflow == "constrain") {components.month = 1; components.day = 1} else throw JulianCalendar.dateOverflow;
		if (components.month > 12) if (options.overflow == "constrain") {components.month = 12; components.day = 31} else throw JulianCalendar.dateOverflow;
		if (components.day < 1) if (options.overflow == "constrain") {components.day = 1} else throw JulianCalendar.dateOverflow;
		let upperDay = JulianCalendar.internalDaysInMonth(components.month, Chronos.isJulianLeapYear(components.year));
		if (components.day > upperDay) if (options.overflow == "constrain") {components.day = upperDay} else throw JulianCalendar.dateOverflow;
		// All controls done, now translate fields into day-index from epoch and return a PlainDate.
		let isoFields = JDISO.toIsoFields (this.calendarClockwork.getNumber(JulianCalendar.shiftYearStart(components,2,0)));
		return new Temporal.PlainDate (...isoFields);
	}
	yearMonthFromFields (askedComponents, options) {//options = {overflow : "constrain"}
		var components = { ... askedComponents }; 
		components.day = 1;		// set to the first day of month in Julian calendar
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw JulianCalendar.ambiguousElement;
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		if ( !JulianCalendar.checkYearFields (components, this.eras[0]) ) throw JulianCalendar.ambiguousElement; 	// This solves the year field 
		let isoFields = this.dateFromFields(components, options).getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Temporal.PlainYearMonth (...isoFields);
	}
	monthDayFromFields (askedComponents, options) { // options = {overflow : "constrain"}
		var components = { ... askedComponents }; 
		components.year = 2000;
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw JulianCalendar.ambiguousElement;
		let isoFields = this.dateFromFields(components, options).getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Temporal.PlainMonthDay (...isoFields);
	}
	/* Methods for Temporal date-like properties
	*/
	era (date) { return this.fieldsFromDate(date).era }
	eraYear (date) { return this.fieldsFromDate(date).eraYear }
	year (date) { return this.fieldsFromDate(date).year }
	month (date) { return this.fieldsFromDate(date).month }
	monthCode (date) { return "M" + this.fieldsFromDate(date).month.toLocaleString( undefined, {minimumIntegerDigits : 2} ) }
	day (date) { return this.fieldsFromDate(date).day }
	dayOfWeek (date) { return this.fullFieldsFromDate (date).dayOfWeek }
	dayOfYear (date) { 
		return JDISO.toCounter (date.getISOFields()) - this.julianClockwork.getNumber(JulianCalendar.shiftYearStart({ year : this.year(date), month : 1, day : 0},2,0));
	}
	weekOfYear (date) { return this.fullFieldsFromDate (date).weekOfYear }
	daysInWeek (date) { return 7 }
	daysInMonth (date) {
		let fields = this.fieldsFromDate(date);
		return JulianCalendar.internalDaysInMonth (fields.month, Chronos.isJulianLeapYear(fields.year))
	}
	daysInYear (date){ return (this.inLeapYear(date) ? 366 : 365) }
	monthsInYear (date) { return 12 }
	inLeapYear (date) { return Chronos.isJulianLeapYear ( this.fieldsFromDate(date).year ) }
	/* Non standard week properties 
	*/
	weeksInYear (date) { // This function is not yet foreseen in Temporal. How many weeks in this (week) year ? 52 or 53 ?
		return this.fullFieldsFromDate(date).weeksInYear
	}
	yearOfWeek (date)	{	// Proposal. Year in the week's calendar corresponding to weekOfYear of the date. In fact, weekYearOffset is more general
		let fields = this.fullFieldsFromDate(date);
		return fields.year + fields.weekYearOffset
	}
	/* Duration-connected methods. Read assumption hereunder.
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in target month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final target date.
	*/
	dateAdd (date, duration, options) {// Add a +/- duration - // options={overflow:"constrain"} not used
		// 1. Build new date components from duration years and months
		let components = this.fieldsFromDate(date); // here year is the algebraic version
		let addedYearMonth = Chronos.divmod ( components.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		delete components.era; delete components.eraYear;  // prepare to dateFromFields
		// overflow option handled in trying to build new date
		let dateOne = this.dateFromFields (components, options); // stated options will do the job
		// 2. Add or subtract days to final result
		let resultFields = JDISO.toIsoFields(JDISO.toCounter(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Temporal.PlainDate (...resultFields);
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) { 
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // 
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration.from("P0D"); break;
			case -1 :{
				let myLarger = this.fieldsFromDate (larger),	// because larger.year may be not adequate { year : larger.year, month : larger.month, day : larger.day },
					mySmaller = this.fieldsFromDate (smaller),
					myDayOffset = this.calendarClockwork.getNumber(JulianCalendar.shiftYearStart (myLarger,2,0)) - this.calendarClockwork.getNumber(JulianCalendar.shiftYearStart (mySmaller,2,0)),
					myWeekOffset = 0, withhold = 0, dayDiff = 0, monthDiff=0, yearDiff=0;
	/* How to handle end of month ?
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
				switch (options.largestUnit) {
					case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
					case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
					case "weeks" : 
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek);
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case undefined : case "auto"  :
					case "days"  : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw JulianCalendar.invalidOption
				}
			}
		}
	}
	toDateString (date) { // non standard display method
		let fields = this.fieldsFromDate (date);
		return  "[" + this.id + "] " + fields.day + "/" + fields.month + "/" 
				+ (fields.eraYear) + " " + fields.era;
		}
} // end of calendar class
class WesternCalendar { 
/**	Class that handle the switching from Julian to Gregorian calendar with the following smoothing conventions:
 * The day of switching is the first day of a new era.
 * The year and month where the switching takes place remain the same, with, by exception, a lesser number of days; daysInMonth, daysInYear and dayOfYear are specially computed.
 * Switching takes place on or after 1582-10-15 (first day of Gregorian calendar in Rome), and on or before 3900-02-28 (last day where less than 28 days are skipped).
 * inLeapYear is considered as expected at the date of computation.If the switching date is 1700-03-01, inLeapYear is true for dates from 1 Jan 1700 to 18 Feb 1700 Julian.
 * Week figures are computed under the ISO rule, but taking the Julian resp. Gregorian calendar at current date as a reference.
 * @param (string) id : name of calendar
 * @param (string) switching date: first Gregorian date in this calendar
*/
	constructor (id, switchingDate) {
		this.id = id;
		this.switchingDate = Temporal.PlainDate.from(switchingDate).withCalendar("iso8601");	//first date where Gregorien calendar is used
		this.switchingYearMonth = Temporal.PlainYearMonth.from(this.switchingDate);
		this.switchingJD = JDISO.toCounter(this.switchingDate.getISOFields());
		// if (this.switchingDateIndex < this.firstSwitchDateIndex)
		if (Temporal.PlainDate.compare (this.switchingDate, WesternCalendar.firstSwitchDate) == -1) 
			throw new RangeError ("Gregorian transition is on or after 1582-10-15");
		if (Temporal.PlainDate.compare (this.switchingDate, WesternCalendar.lastSwitchDate) == 1)
			throw new RangeError ("Gregorian transition handled on or before 3900602-28");
		this.lastJulianDate = Temporal.PlainDate.from(this.switchingDate).withCalendar(WesternCalendar.julianCalendar).subtract("P1D")		//.withCalendar(this);

		// compute here specific daysInMonth and daysInYear
		this.specialYear = [this.lastJulianDate.year];
		if ( this.switchingDate.year != this.specialYear[0] ) this.specialYear.push (this.switchingDate.year);
		this.specialMonth = [this.lastJulianDate.month];
		if ( this.switchingDate.month != this.specialMonth[0] ) this.specialMonth.push (this.switchingDate.month);
		this.specialYearDays = []; this.specialMonthDays = [];
		if (this.specialYear.length == 1) {
			this.specialYearDays [0] = 
				Temporal.PlainDate.from({calendar : WesternCalendar.julianCalendar, year : this.specialYear[0], month : 1, day : 1}).withCalendar('iso8601')
				.until(Temporal.PlainDate.from({calendar : 'iso8601', year : this.specialYear[0], month : 12, day : 31})).days + 1;
		} else {
			this.specialYearDays [0] = 
				Temporal.PlainDate.from({calendar : WesternCalendar.julianCalendar, year : this.specialYear[0], month : 1, day : 1})
				.until(Temporal.PlainDate.from({calendar : WesternCalendar.julianCalendar, year : this.specialYear[0], month : this.specialMonth[0], 
				day : this.lastJulianDate.day})).days + 1;
			this.specialYearDays [1] = Temporal.PlainDate.from({calendar : 'iso8601', year : this.specialYear[1], month : this.specialMonth[1], day : this.switchingDate.day})
				.until(Temporal.PlainDate.from({calendar : 'iso8601', year : this.specialYear[1], month : 12, day : 31})).days + 1;
		}
		let lday = this.switchingDate.daysInMonth;
		if (this.specialMonth.length == 1) {
			this.specialMonthDays [0] =
				Temporal.PlainDate.from({calendar : WesternCalendar.julianCalendar, year : this.specialYear[0], month : this.specialMonth[0], day : 1}).withCalendar('iso8601')
				.until(Temporal.PlainDate.from({calendar : 'iso8601', year : this.specialYear[0], month : this.specialMonth[0], day : lday})).days + 1;
		} else {
			let lastind = this.specialYear.length - 1;
			this.specialMonthDays [0] =
				Temporal.PlainDate.from({calendar : WesternCalendar.julianCalendar, year : this.specialYear[0], month : this.specialMonth[0], day : 1})
				.until(Temporal.PlainDate.from({calendar : WesternCalendar.julianCalendar, year : this.specialYear[0], month : this.specialMonth[0], 
				day : this.lastJulianDate.day})).days + 1;
			this.specialMonthDays [1] =
				Temporal.PlainDate.from({calendar : 'iso8601', year : this.specialYear[lastind], month : this.specialMonth[1], day : this.switchingDate.day})
				.until(Temporal.PlainDate.from({calendar : 'iso8601', year : this.specialYear[lastind], month : this.specialMonth[1],
				day : lday})).days + 1;
		}
	}
	/* Errors
	*/
	static missingElement = new TypeError ("missing date element")
	static ambiguousElement = new TypeError ("ambiguous date elements")
	static missingOption = new TypeError ("expected option missing")
	static invalidOption = new RangeError ("unknown option")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static dateOverflow = new RangeError ("invalid date") // thrown in case of overflow : reject option
	/* Internal objects 
	*/
	static firstSwitchDate = Temporal.PlainDate.from ("1582-10-15")	 // First date of any non-proleptic gregorian calendar
	static lastSwitchDate = Temporal.PlainDate.from("3900-02-28")		// This is the latest switching date where less than 28 days are skipped
	static julianCalendar = new JulianCalendar("julian")
	/* Basics for interaction with Temporal objects
	*/
	toString() {return this.id}	// necessary for subclasses, in order to get id passed as a parameter
	toJSON ()  {return this.id}
	fields (theFields) {	// Add era and eraYear if year is in list
		if (theFields.includes('year')) {
			theFields.push ('eraYear');
			theFields.push ('era')
		}
		return theFields
	}
	mergeFields (fields, additionalFields) {	// monthCode converted to month ; [era, eraYera] shall throw [year] out
		let returnFields = {...fields }; 	// prepare return value
		if (additionalFields.monthCode != undefined && additionalFields.month != undefined) throw WesternCalendar.ambiguousElement; // Checked by Temporal objects ?
		if (additionalFields.monthCode != undefined) delete returnFields.month;
		if (additionalFields.month != undefined) delete returnFields.monthCode;
		if ((additionalFields.eraYear != undefined) != (additionalFields.era != undefined)) throw WesternCalendar.missingElement; // Checked by Temporal objects ?
		if (additionalFields.year != undefined && additionalFields.eraYear != undefined) throw WesternCalendar.ambiguousElement; // Checked by Temporal objects ?
		if (additionalFields.year != undefined) { delete returnFields.eraYear; delete returnFields.era };
		if (additionalFields.eraYear != undefined ) delete returnFields.year;
		return Object.assign(returnFields, additionalFields)
	}
	eras = ["e0", "e1", "e2"]
	/* Calendar specific objects
	*/
	w1Day = 4	// the day number in January that characterises the first week
	gregorianClockwork = new Chronos ({ // To be used with day counter from ISO 0000-03-01. Decompose into shifted Gregorian calendar years, months, date, and gives weeks
		timeepoch : 1721120, // Julian day of ISO 0000-03-01
		coeff : [ 
		  {cyclelength : 146097, ceiling : Infinity, subCycleShift : 0, multiplier : 400, target : "year"}, // 4 centuries
		  {cyclelength : 36524, ceiling :  3, subCycleShift : 0, multiplier : 100, target : "year"},		// one short century
		  {cyclelength : 1461, ceiling : Infinity, subCycleShift : 0, multiplier : 4, target : "year"}, // 4 Julian years
		  {cyclelength : 365, ceiling : 3, subCycleShift : 0, multiplier : 1, target : "year"}, // One 365-days year
		  {cyclelength : 153, ceiling : Infinity, subCycleShift : 0, multiplier : 5, target : "month"}, // Five-months cycle
		  {cyclelength : 61, ceiling : Infinity, subCycleShift : 0, multiplier : 2, target : "month"}, // 61-days bimester
		  {cyclelength : 31, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "month"}, // 31-days month
		  {cyclelength : 1, ceiling : Infinity, subCycleShift : 0, multiplier : 1, target : "day"}
		],
		canvas : [ 
			{name : "year", init : 0},	// year is a signed integer, 0 meaning 1 before Christ
			{name : "month", init : 3}, // Shifted year begins with month number 3 (March), thus simplify month shifting
			{name : "day", init : 1}
		]
		}) // end of calendRule
	weekClockWork = new WeekClock ( {	// weekdayRule
		originWeekday: 1, 		// weekday of Julian Day 0 is Monday
		daysInYear: (year) => {	// this function differs from daysInYear designed hereunder, since here we aim at week computation only
			if (year >= this.switchingDate.year) return (Chronos.isGregorianLeapYear( year ) ? 366 : 365)
			else return (Chronos.isJullianLeapYear( year ) ? 366 : 365)
			},
		startOfWeek : 1,		// week start with 1 (Monday)
		characWeekNumber : 1,	// we have a week 1 and the characteristic day for this week is 4 January.
		dayBase : 1,			// use 1..7 display for weekday
		weekBase : 1,			// number of week begins with 1
		weekLength : 7			
	} )
	/* 	Calendar fields generator from any date 
	*/
	fieldsFromDate (date) {	// compute essential fields for  this calendar, after isoFields of any date. Week fields computed separately, on demand.
		var 
			isoFields = date.getISOFields(),
			index = JDISO.toCounter (isoFields), 
			fields;
		if  (index >= this.switchingJD)	// in Gregorian period
			fields = {era : this.eras[2], eraYear : isoFields.isoYear, year : isoFields.isoYear, month : isoFields.isoMonth, day : isoFields.isoDay}
		else {
			fields = WesternCalendar.julianCalendar.fieldsFromDate (date);
			fields.era = fields.era == WesternCalendar.julianCalendar.eras[1] ? this.eras[1] : this.eras[0];
		}
		return fields;
	}
	fullFieldsFromDate (date) {	// compute all fields that characterise this date in this calendar, including week fields.
		var index = JDISO.toCounter (date.getISOFields()),
			fullFields = this.fieldsFromDate (date);
		if (index >= this.switchingJD)	// Own computation of full figures, because week has a small problem, and maybe new fields will appear next.
			[fullFields.weekOfYear, fullFields.dayOfWeek, fullFields.weekYearOffset, fullFields.weeksInYear] = this.weekClockWork.getWeekFigures 
				(index, this.gregorianClockwork.getNumber(JulianCalendar.shiftYearStart({ year : fullFields.year, month : 1, day : this.w1Day },2,0)), fullFields.year)
		else {
			let julianFields = WesternCalendar.julianCalendar.fullFieldsFromDate(date);
			[fullFields.weekOfYear, fullFields.dayOfWeek, fullFields.weekYearOffset, fullFields.weeksInYear] = 
				[julianFields.weekOfYear, julianFields.dayOfWeek, julianFields.weekYearOffset, julianFields.weeksInYear]
		}
		return fullFields;
	}
	/* Date and Temporal objects generator from fields representing a date in the western historic calendar
	*/
	dateFromFields (askedComponents, options) { // options = {overflow : "constrain"} necessary ?
		var components = { ... askedComponents }, testDate, finalFields; 
		// check parameter values
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw WesternCalendar.missingElement;
		// Check that all necessary fields are present and do not contradict each other. user may either submit era and eraYear, or submit year as a relative number, without era
		if ( !JulianCalendar.checkYearFields (components, this.eras[0]) ) throw WesternCalendar.ambiguousElement; 
		// Check for valid era in this specific calendar
		if (components.era != undefined && !this.eras.includes(components.era)) throw WesternCalendar.outOfRangeDateElement;
		// check and constrain parameter values with respect to overflow option, against general Julian calendar rule
		if (components.month < 1) if (options.overflow == "constrain") {components.month = 1; components.day = 1} else throw WesternCalendar.dateOverflow;
		if (components.month > 12) if (options.overflow == "constrain") {components.month = 12; components.day = 31} else throw WesternCalendar.dateOverflow;
		if (components.day < 1) if (options.overflow == "constrain") {components.day = 1} else throw WesternCalendar.dateOverflow;
		let upperDay = JulianCalendar.internalDaysInMonth(components.month, Chronos.isJulianLeapYear(components.year));
		if (components.day > upperDay) if (options.overflow == "constrain") {components.day = upperDay} else throw WesternCalendar.dateOverflow;
		/*	
		If era is unspecified, first compare the Gregorian presentation to the switching date. 
		If era specified, the caller knows what he wants, fields are analysed following era indication, even is era is not in line with switching date.
		If after, confirm "e2". If before, mark "e1"; if "e0", JulianCalendar.checkYearFields has converted .year to negative value.
		After era is determined, date is computed, and a last overflow control is performed. Range error is thrown for any "e2" date before 1582-10-15.
		*/	
		if (components.era == undefined) {	// era not user-defined, Gregorian transition date assumed
			components.calendar = "iso8601";
			testDate = Temporal.PlainDate.from (components); // Try to build a Gregorian date, with "constrain"
			if (Temporal.PlainDate.compare (testDate, this.switchingDate) >= 0) {// on or after transition date
				let upperDay = JulianCalendar.internalDaysInMonth(components.month, Chronos.isGregorianLeapYear (components.year) );
				if (components.day > upperDay) if (options.overflow == "constrain") {components.day = upperDay} else throw WesternCalendar.dateOverflow;
				return new Temporal.PlainDate (...components)
			} else { // Date without expressed era is before transition date in Gregorian
				components.calendar = WesternCalendar.julianCalendar;
				testDate = Temporal.PlainDate.from (components, options);
				if (Temporal.PlainDate.compare (testDate, this.lastJulianDate.withCalendar(WesternCalendar.julianCalendar)) > 0) { // computed date is above last Julian date
					if (options.overflow = "constrain") {
						let myFields = this.lastJulianDate.getISOFields();
						return new Temporal.PlainDate (...myFields)
					} else throw WesternCalendar.dateOverflow;
				}
				let myFields = testDate.getISOFields();
				return new Temporal.PlainDate (myFields)
			}
		}
		else // here follow user's "e0", "e1" or "e2" indication; "e1" is considered like undefined.
			if (components.era == this.eras[2]) {	// user says "New Style"
				components.calendar = "iso8601";
				testDate = Temporal.PlainDate.from (components, options);	// will throw if options says so
				if (Temporal.PlainDate.compare (testDate, WesternCalendar.firstSwitchDate) < 0) throw WesternCalendar.invalidEra
				else {
					let myFields = testDate.getISOFields();
					return new Temporal.PlainDate (myFields)
				}
			}
			else {	// user says an era of Julian calendar.
				if (components.era == this.eras[1]) components.era = WesternCalendar.julianCalendar.eras[1];	// if era of index 1, that is era of year 1.
				components.calendar = WesternCalendar.julianCalendar;
				testDate = Temporal.PlainDate.from (components, options);
				let myFields = testDate.getISOFields();
				return new Temporal.PlainDate (myFields)
			}
		}
	yearMonthFromFields (askedComponents, options) {// options = {overflow : "constrain"}
		var components = { ... askedComponents };
		components.day = 1;
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw WesternCalendar.missingElement;
		if ( !JulianCalendar.checkYearFields (components, this.eras[0]) ) throw WesternCalendar.ambiguousElement; 
		if (components.era != undefined && !this.eras.includes(components.era)) throw WesternCalendar.outOfRangeDateElement;
		let myISOFields = this.dateFromFields(components, options).getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Temporal.PlainYearMonth (myISOFields);
	}
	monthDayFromFields (askedComponents, options) { // options = {overflow : "constrain"}
		var components = { ... askedComponents }; 
		components.year = 2000;
		if (components.month == undefined) component.month = Number(components.monthCode.match(/\d+/)[0]);
		if (isNaN(components.month)) throw WesternCalendar.ambiguousElement;
		let myISOFields = this.dateFromFields(components, options).getISOFields();
		return new Temporal.PlainMonthDay (myISOFields);
	}
	/* Methods for Temporal date-like properties
	*/
	era (date) { return this.fieldsFromDate(date).era }
	eraYear (date) { return this.fieldsFromDate(date).eraYear }
	year (date) { return this.fieldsFromDate(date).year }
	month (date) { return this.fieldsFromDate(date).month }
	monthCode (date) { return "M" + this.fieldsFromDate(date).month.toLocaleString( undefined, {minimumIntegerDigits : 2}) }
	day (date) { return this.fieldsFromDate(date).day }
	dayOfWeek (date) { return this.fullFieldsFromDate(date).dayOfWeek }

	dayOfYear (date) { 
		let fields = this.fieldsFromDate(date);
		let iy = this.specialYear.indexOf (fields.year);
		if (iy == 1)		// the first day of this year was the switching date, not 1. Jan
			return Temporal.PlainDate.from(this.switchingDate).until(date.withCalendar('iso8601')).days + 1
		else
			return date.since(this.dateFromFields ({ year : this.fields.year, month : 1, day : 1}, {overflow : 'reject'})).days + 1
	}
	weekOfYear (date) { return this.fullFieldsFromDate(date).weekOfYear }
	daysInWeek (date) { return 7 }

	daysInMonth (date) { 
		let fields = this.fieldsFromDate(date);
		let im = -1;
		let iy = this.specialYear.indexOf (fields.year);
		if (iy >= 0) im = this.specialMonth.indexOf (fields.month);
		if ( this.specialYear.length == 2 &&  (im == 1) != ( iy == 1 ) )  im = -1;	// Case year changes during switching period
		if (im >= 0) { return this.specialMonthDays[im] }
		else if (fields.era == this.eras[2]) { return date.withCalendar("gregory").daysInMonth }
			else return JulianCalendar.internalDaysInMonth (fields.month, Chronos.isJulianLeapYear(fields.year))
	}
	daysInYear (date) { 
		let fields = this.fieldsFromDate(date);
		let iy = this.specialYear.indexOf (fields.year);
		if ( iy >=0 ) { return this.specialYearDays[iy] }
		else switch (fields.era) {
			case this.eras[0] : 
			case this.eras[1] : return Chronos.isJulianLeapYear(fields.year) ? 366 : 365;  
			case this.eras[2] : return Chronos.isGregorianLeapYear(fields.year) ? 366 : 365;
		}
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) { // a same year, like 1700 for a switching date that year, may be leap at the begining, then common.
		switch (date.era) {
			case this.eras[0] : 
			case this.eras[1] : return Chronos.isJulianLeapYear(date.year); 
			case this.eras[2] : return Chronos.isGregorianLeapYear(date.year);
		}
	}
	/* Non standard week properties 
	*/
	weeksInYear (date) { // This function is not yet foreseen in Temporal. How many weeks in this (week) year ? 52 or 53 ?
		return this.fullFieldsFromDate(date).weeksInYear
	}
	yearOfWeek (date)	{	// Proposal. Year in the week's calendar corresponding to weekOfYear of the date. In fact, weekYearOffset is more general
		let fields = this.fullFieldsFromDate(date);
		return fields.year + fields.weekYearOffset
	}
	/* Duration-connected methods
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in targer month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final targer date.
	*/
	dateAdd (date, duration, options) {// Add a +/- duration - //options={overflow:"constrain"}
		let components = this.fieldsFromDate(date), 
			addedYearMonth = Chronos.divmod ( components.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		delete components.era; delete components.eraYear;
		// overflow option handled in trying to build new date
		let dateOne = this.dateFromFields (components, options); // stated options will do the job. 
		// However, the case of "blackout" period may be not considered. Here the decision is to constrain day to the last of Julian epoch
		components.calendar = "gregory";
		let dateOneJD = JDISO.toCounter(dateOne.getISOFields()), 
			componentsGregoryJD = JDISO.toCounter (Temporal.PlainDate.from (components).getISOFields());
		if (dateOneJD >= this.switchingJD && componentsGregoryJD < this.switchingJD)		// case where the date computed by adding years and months fall in the blackout dates range
			switch (options.overflow) {
				case "reject" : throw WesternCalendar.dateOverflow ;
				case undefined : case "constrain" : dateOne = Temporal.PlainDate.from(this.lastJulianDate);
			};
		// Finally add or subtract days to final result
		let resultFields = JDISO.toIsoFields(JDISO.toCounter(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Temporal.PlainDate (resultFields)
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) {  //
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // 
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration.from("P0D"); break;
			case -1 :{
				let myLarger  = this.fieldsFromDate (larger), // like in JulianCalendar
					mySmaller = this.fieldsFromDate (smaller), // { year : smaller.calendar.year(smaller), month : smaller.month, day : smaller.day },
					myDayOffset = JDISO.toCounter(larger.getISOFields()) - JDISO.toCounter(smaller.getISOFields()),
					myWeekOffset = 0, withhold = 0, dayDiff = 0, monthDiff=0, yearDiff=0;
	/* 
	It could seem more logical to distinguish between 30 == last day of month, and 30 == not the last one
	In practical, better results are obtained by cutting all months to 30, except of course if February is one of the dates.
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
				switch (options.largestUnit) {
					case "years" : return Temporal.Duration.from({years: yearDiff, months: monthDiff, days: dayDiff}); break;
					case "months": return Temporal.Duration.from({months: yearDiff*12+monthDiff, days: dayDiff}); break;
					case "weeks" : 
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek);
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case undefined : case "auto" : 
					case "days"  : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw WesternCalendar.invalidOption
				}
			}
		}
	}
	toDateString (date) { // non standard display method
		let fields = this.fieldsFromDate(date);
		return "[" + this.id + "] " + fields.day + "/" + fields.month + "/" 
			+ (fields.eraYear) + " " + fields.era 
	}
}// end of calendar class

const
	milesian = new MilesianCalendar ("milesian"),
	julian = new JulianCalendar ("julian"),
	vatican = new WesternCalendar ("vatican","1582-10-15"),
	french = new WesternCalendar ("french","1582-12-20"),
	german = new WesternCalendar ("german","1700-03-01"),
	english = new WesternCalendar("english","1752-09-14"),
	swiss = new WesternCalendar("swiss","1701-01-12");

