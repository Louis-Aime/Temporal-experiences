/* A selection of calendar for tries with Temporal
*/
/* Version	M2021-02-03	New Temporal, no date.getFields, enforece year / eraYear fields
	M2020-01-19 Adapt to newer version of chronos.js, file names in lowercase
	M2020-12-28 JulianCalendar.shiftYearStart as static method
	M2020-11-26 - handle options at date initialisation, care for "compare" which requires egality in calendar in order to yield "0"
	M2020-11-25 suppress registers, do not memorise former date computations.
	M2020-11-23 - all calendars defined in the same file. Do not subclass basic calendars. Personal toDateString enhanced. Subtract method suppressed. No time method (no harm)
*/
/* Version note
year and eraYear are 2 possible fields date fields given by the calendar reckoning system.
In this version, year is the algebraic signed integer value of the year, without hole, used in all computations,
whereas eraYear denotes the integer value associated with an era indication.
It is deemed that [era, eraYear] is never required on input, whereas year is required (except for MonthDay).
In this version, because Temporal polyfill requires year in all cases, the following assumption is made:
	If era is specified but eraYear is not, year stands for eraYear.
	Here, for Roman calendars a control is performed if year and eraYear are specified: then era must also be specified, and all those value have to match.
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
	constructor () {
		this.id = "milesian";	// this is of the same level as i"so8601", "gregory" etc.
	}
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	toString () {return this.id}
	fields (theFields) {return theFields} // nothing to add to the standard fields year, month, day
	static from (thing) {return Temporal.Calendar.from(thing)}	// This should not be used, but just in case.
	/* Basic calendar-specific objects 
	*/
	static invalidOption = new RangeError ("unknown option")
	static ambiguousElement = new RangeError ("ambiguous date elements")
	static dateOverflow = new RangeError ("invalid date") // thrown in case of overflow : reject option
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
	dateFromFields (askedComponents, options, Construct=Temporal.PlainDate) { // = {overflow : "constrain"} necessary when this routine is called by Temporal's other (dateAdd) ?
		var components = { ... askedComponents }; 
		// Temporal initialisez and checks options parameter
		// Temporal throws non-numeric values for date parameters
		// Temporal checks completeness
		// First constrain month. If outside 1..12, set to first resp. last day of year.
		if (components.month < 1) if (options.overflow == "constrain") { components.month = 1; components.day = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.month > 12) if (options.overflow == "constrain") { 
				components.month = 12; 
				components.day = MilesianCalendar.internalDaysInMonth ( 12, Chronos.isGregorianLeapYear(components.year + 1) )
			} 
			else throw MilesianCalendar.dateOverflow;
		// Now, month is in good range, constrain day
		if (components.day < 1) if (options.overflow == "constrain") { components.day = 1 } else throw MilesianCalendar.dateOverflow;
		let upperDay = MilesianCalendar.internalDaysInMonth ( components.month, Chronos.isGregorianLeapYear(components.year + 1) );
		if (components.day > upperDay) if (options.overflow == "constrain") { components.day = upperDay } else throw MilesianCalendar.dateOverflow;
		// compute day index from elements, compute isoFields and return.
		let isoFields = JDISO.toIsoFields (this.calendarClockwork.getNumber(components));
		return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this);
	}
	yearMonthFromFields (askedComponents, options, Construct=Temporal.PlainYearMonth) { // options = {overflow : "constrain"}
		var components = { ... askedComponents }; 
		if (components.month < 1) if (options.overflow == "constrain") { components.month = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.month > 12 ) if (options.overflow == "constrain") { components.month = 12 } else throw MilesianCalendar.dateOverflow;
		return new Construct(components.year, components.month, this, 13);// Year and month for that day is always the same in Milesian and ISO 8601
	}
	monthDayFromFields (askedComponents, options, Construct=Temporal.PlainMonthDay) { // options = {overflow : "constrain"}
		var components = { month : askedComponents.month, day : askedComponents.day };
		if (components.month < 1) if (options.overflow == "constrain") { components.month = 1; components.day = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.month > 12 ) if (options.overflow == "constrain") { components.month = 12;  components.day = 31 } 
			else throw MilesianCalendar.dateOverflow;
		if (components.day < 1) if (options.overflow == "constrain") { components.day = 1 } else throw MilesianCalendar.dateOverflow;
		if (components.day > 31 || ( components.day == 31 && Chronos.mod (components.month, 2) == 1 ))  
			if (options.overflow == "constrain") { components.day = 30 + (Chronos.mod (components.month, 2) == 0 ? 1 : 0) } else throw MilesianCalendar.dateOverflow;
		components.year = (components.month == 12 && components.day == 31) ? 1999 : 2000;	// Long cycle between 31 12m N-1 and 30 12m N, where N is a bissextile year number.
		let myFields = this.dateFromFields(components, options).getISOFields();
		return new Construct(myFields.isoMonth, myFields.isoDay, this, myFields.isoYear);
	}
	/* Methods for elements of date
	*/
	year (date) {
		return this.fieldsFromDate(date).year
	}
	month (date) {
		return this.fieldsFromDate(date).month
	}
	day (date) {
		return this.fieldsFromDate(date).day
		}
	daysInWeek (date) {return 7}
	dayOfWeek (date) {
		return this.fullFieldsFromDate(date).dayOfWeek
	}
	daysInYear (date){
		return (this.inLeapYear(date) ? 366 : 365) 
	}
	dayOfYear (date) {
		let fields = this.fieldsFromDate(date), m = fields.month - 1;
		return fields.day + 30*(m % 2) + 61*Math.floor (m/2)
	}
	weekOfYear (date) {	
		return this.fullFieldsFromDate(date).weekOfYear
	} 
	daysInMonth (date) {
		let fields = this.fieldsFromDate(date), m = fields.month - 1;
		return m % 2 == 0 ? 30 : ( m == 11 && ! Chronos.isGregorianLeapYear (fields.year + 1) ? 30 : 31)
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) {
		return Chronos.isGregorianLeapYear (this.fieldsFromDate(date).year + 1)
	}
	/* Non standard week properties 
	*/
	weeksInYear (date) {
		let fields = this.fullFieldsFromDate(date);
		return fields.weeksInYear
	}
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
	dateAdd (date, duration, options, Construct) {// Add a +/- duration - // no default value options={overflow:"constrain"}
		// 1. Build new date components from duration years and months
		let components = this.fieldsFromDate(date),
			addedYearMonth = Chronos.divmod ( components.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		// dateFromFields shall handle overflow option
		let dateOne = this.dateFromFields (components, options, Construct);
		// 2. Add or subtract days to first step result
		let resultFields = JDISO.toIsoFields(JDISO.toCounter(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) { //
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // throw MilesianCalendar.invalidOrder; break;
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
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
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		let fields = this.fullFieldsFromDate(date);
		let absYear = Math.abs(fields.year);
		return  "[" + this.id + "] " 
			+ fields.day + " " + fields.month + "m " 
			+ ((fields.year < 0) ? "-": "") 
			+ ((absYear < 100) ? "0" : "") + ((absYear < 10) ? "0" : "") + absYear; 
		}
} // end of calendar object/class

class JulianCalendar  {
/**	Parameters for julian calendar variants
 * @param (number) weekStart : the day number of the first day of week, default 1 for Monday.
 * @param (number) w1Day : the day in the first month that is always in the week 1 of year, default 4 meaning 4 January.
*/
	constructor (id) {
		this.id = id;
	}
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	toString () {return this.id}
	fields (theFields) {	// For Temporal: add "era", and see whether one may leave it undefined.
		let myFields = [...theFields];	// a brand new Array
		if (myFields.includes ("year")) {
			if ( ! myFields.includes ("era") ) myFields.unshift("era");
			if ( ! myFields.includes ("eraYear") ) myFields.unshift("eraYear")
		}
		return myFields;
	}
	eras = ["bc", "ad"]	// basic codes for eras should always be in small letters
	/* Basics data and computing options
	*/
	w1Day = 4	// the day number in January that characterises the first week
	static invalidOption = new RangeError ("unknown option")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static ambiguousElement = new RangeError ("ambiguous date elements")
	static dateOverflow = new RangeError ("date overflow with reject option") // thrown in case of overflow : reject option
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
		startOfWeek : 0,		// week start with 0 (Sunday)
		characWeekNumber : 1,	// we have a week 1 and the characteristic day for this week is 4 January. Little change with respect to ISO.
		dayBase : 1,			// use 1..7 display for weekday
		weekBase : 1,			// number of week begins with 1
		weekLength : 7			
	}) // end of new Chronos declaration
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
		if ( (components.year == undefined) && (components.eraYear == undefined || components.era == undefined) ) 
			return false;	// year must be defined in some way
		if (components.era == undefined && components.eraYear != undefined) return false;	// if era not defined, eraYear should not be used
		if ( components.year != undefined && components.eraYear != undefined && 
			components.year != components.eraYear && (components.era != eras[0] || components.year != 1 - components.eraYear) )
			return false;	// Year indications contradict each other
		if (components.era == BCEra && components.year > 0) components.year = 1 - components.year;	// Here user specified a backwards counted year
		if (components.year == undefined) components.year = components.era == BCEra ? 1 - components.eraYear : eraYear;
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
	dateFromFields (askedComponents, options={overflow : "constrain"}, Construct=Temporal.PlainDate) { // options = {overflow : "constrain"} necessary
		var components = { ...askedComponents }; 
		// check parameter values
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
		// All controls done, now translate fields into day-index from epoch and then to IsoFields, and construct PlainDate.
		let isoFields = JDISO.toIsoFields (this.calendarClockwork.getNumber(JulianCalendar.shiftYearStart(components,2,0)));
		return new Construct (isoFields.isoYear, isoFields.isoMonth, isoFields.isoDay, this); // standard return
	}
	yearMonthFromFields (askedComponents, options, Construct=Temporal.PlainYearMonth) {//options = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : 1 }; // set to the first day of month in Julian calendar
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		if ( !JulianCalendar.checkYearFields (components, this.eras[0]) ) throw JulianCalendar.ambiguousElement; 	// This solves the year field 
		let myISOFields = this.dateFromFields(components, options).getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Construct(myISOFields.isoYear, myISOFields.isoMonth, this, myISOFields.isoDay);
	}
	monthDayFromFields (askedComponents, options, Construct=Temporal.PlainMonthDay) { // options = {overflow : "constrain"}
		var components = { year : 2000, month : askedComponents.month, day : askedComponents.day }; 
		let myISOFields = this.dateFromFields(components, options).getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Construct(myISOFields.isoMonth, myISOFields.isoDay, this, myISOFields.isoYear);
	}
	/* Methods for Temporal date-like properties
	*/
	era (date) { 
		return this.fieldsFromDate(date).era 
		}
	eraYear (date) {
		return this.fieldsFromDate(date).eraYear;
	}
	year (date) {
		return this.fieldsFromDate(date).year;
		}
	month (date) {
		return this.fieldsFromDate(date).month;
		}
	day (date) {
		return this.fieldsFromDate(date).day;
		}
	dayOfWeek (date) {
		return this.fullFieldsFromDate (date).dayOfWeek
	}
	dayOfYear (date) {
		return JDISO.toCounter (date.getISOFields()) - this.julianClockwork.getNumber(JulianCalendar.shiftYearStart({ year : this.year(date), month : 1, day : 0},2,0));
	}
	weekOfYear (date) {
		return this.fullFieldsFromDate (date).weekOfYear
	}
	daysInWeek (date) { return 7 }
	daysInMonth (date) {
		let fields = this.fieldsFromDate(date);
		return JulianCalendar.internalDaysInMonth (fields.month, Chronos.isJulianLeapYear(fields.year))
	}
	daysInYear (date){
		return (this.inLeapYear(date) ? 366 : 365) 
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) {
		return Chronos.isJulianLeapYear ( this.fieldsFromDate(date).year )
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
	/* Duration-connected methods. Read assumption hereunder.
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in target month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final target date.
	*/
	dateAdd (date, duration, options, Construct) {// Add a +/- duration - // options={overflow:"constrain"} not used
		// 1. Build new date components from duration years and months
		let components = this.fieldsFromDate(date); 
		let addedYearMonth = Chronos.divmod ( components.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		delete components.era; delete components.eraYear;  // prepare to dateFromFields
		// overflow option handled in trying to build new date
		let dateOne = this.dateFromFields (components, options, Construct); // stated options will do the job
		// 2. Add or subtract days to final result
		let resultFields = JDISO.toIsoFields(JDISO.toCounter(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) { 
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // 
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
			case -1 :{
				let myLarger = { year : larger.year, month : larger.month, day : larger.day },
					mySmaller = { year : smaller.year, month : smaller.month, day : smaller.day },
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
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		let fields = this.fieldsFromDate (date);
		return  "[" + this.id + "] " + fields.day + "/" + fields.month + "/" 
				+ (fields.year) + " " + fields.era;
		}
} // end of calendar class

class WesternCalendar { // here try to use other Temporal tools rather than basic Chronos tools, whenever possible. // does not extend Temporal.Calendar
	constructor (id, switchingDate) {
		this.id = id;
		this.switchingDate = Temporal.PlainDate.from(switchingDate).withCalendar("gregory");	//first date where Gregorien calendar is used
		this.switchingJD = JDISO.toCounter(this.switchingDate.getISOFields());
		// if (this.switchingDateIndex < this.firstSwitchDateIndex)
		if (Temporal.PlainDate.compare (this.switchingDate, this.firstSwitchDate) == -1) 
			throw new RangeError ("Gregorian transition is on or after 1582-10-15");
		this.lastJulianDate = Temporal.PlainDate.from(this.switchingDate).withCalendar(this.julianCalendar).subtract("P1D").withCalendar(this);
	}
	/* Basics for interaction with Temporal objects
	*/
	toString() {return this.id}	// necessary for subclasses, in order to get id passed as a parameter
	fields (theFields) {	// For Temporal. add "era" if not seen
		let myFields = [...theFields];	// a brand new Array
		if (myFields.includes ("year")) {
			if ( ! myFields.includes ("era") ) myFields.unshift("era");
			if ( ! myFields.includes ("eraYear") ) myFields.unshift("eraYear")
		return myFields;
		}
	}
	eras = ["bc", "as", "ns"]
	/* Calendar specific objects
	*/
	w1Day = 4	// the day number in January that characterises the first week
	static invalidOption = new RangeError ("unknown option")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static ambiguousElement = new RangeError ("ambiguous date elements")
	static dateOverflow = new RangeError ("date overflow with reject option") // thrown in case of overflow : reject option
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
			{name : "year", init : 0},	// year is a signed integer, 0 meaning 1 bc
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
	/* Internal objects 
	*/
	firstSwitchDate = Temporal.PlainDate.from ("1582-10-15").withCalendar("gregory") // First date of A.S. or N.S. era
	julianCalendar = new JulianCalendar("julian");
	/* 	Calendar fields generator from any date 
	*/
	fieldsFromDate (date) {	// compute essential fields for  this calendar, after isoFields of any date. Week fields computed separately, on demand.
		var 
			isoFields = date.getISOFields(),
			index = JDISO.toCounter (isoFields), 
			fields;
		if  (index >= this.switchingJD)	// in Gregorian period //(Temporal.PlainDate.compare (date.withCalendar("gregory"), this.switchingDate) >= 0) does not work for equal dates !!
			fields = {era : this.eras[2], eraYear : isoFields.isoYear, year : isoFields.isoYear, month : isoFields.isoMonth, day : isoFields.isoDay}
		else {
			fields = this.julianCalendar.fieldsFromDate (date);
			fields.era = fields.era == this.julianCalendar.eras[1] ? this.eras[1] : this.eras[0];
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
			let julianFields = this.julianCalendar.fullFieldsFromDate(date);
			[fullFields.weekOfYear, fullFields.dayOfWeek, fullFields.weekYearOffset, fullFields.weeksInYear] = 
				[julianFields.weekOfYear, julianFields.dayOfWeek, julianFields.weekYearOffset, julianFields.weeksInYear]
		}
		return fullFields;
	}
	/* Date and Temporal objects generator from fields representing a date in the western historic calendar
	*/
	dateFromFields (askedComponents, options, Construct=Temporal.PlainDate) { // options = {overflow : "constrain"} necessary ?
		var components = { ... askedComponents }, testDate, finalFields; 
		// check parameter values
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
		If after, confirm "ns". If before, mark "as"; if "bc", JulianCalendar.checkYearFields has converted .year to negative value.
		After era is determined, date is computed, and a last overflow control is performed. Range error is thrown for any "ns" date before 1582-10-15.
		*/	
		if (components.era == undefined) {	// era not user-defined, Gregorian transition date assumed
			components.calendar = "gregory";
			testDate = Temporal.PlainDate.from (components); // Try to build a Gregorian date, with "constrain"
			if (Temporal.PlainDate.compare (testDate, this.switchingDate.withCalendar("gregory")) >= 0) {// on or after transition date
				let upperDay = JulianCalendar.internalDaysInMonth(components.month, Chronos.isGregorianLeapYear (components.year) );
				if (components.day > upperDay) if (options.overflow == "constrain") {components.day = upperDay} else throw WesternCalendar.dateOverflow;
				return new Construct (components.year, components.month, components.day, this)
/*				testDate = Temporal.PlainDate.from (components,options);		// Create new object, obtain reject or constrain if required.
				[components.era, components.eraYear, components.year, components.month, components.day] = 
					[this.eras[2], testDate.year, testDate.year, testDate.month, testDate.day];
*/
			} else { // Date without expressed era is before transition date
				// components.era = this.julianCalendar.eras[1];  //for Julian calendar analysis
				components.calendar = this.julianCalendar;
				testDate = Temporal.PlainDate.from (components, options);
				if (Temporal.PlainDate.compare (testDate, this.lastJulianDate.withCalendar(this.julianCalendar)) > 0) { // computed date is above last Julian date
					if (options.overflow = "constrain") {
						let myFields = this.lastJulianDate.getISOFields();
						return new Construct (myFields.isoYear, myFields.isoMonth, myFields.isoDay, this)
					} else throw WesternCalendar.dateOverflow;
				}
				let myFields = testDate.getISOFields();
				return new Construct (myFields.isoYear, myFields.isoMonth, myFields.isoDay, this)
			}
		}
		else // here the follow user's "bc", "as" or "ns" indication; "ad" is considered like undefined.
			if (components.era == this.eras[2]) {	// user says "New Style"
				components.calendar = "gregory";
				testDate = Temporal.PlainDate.from (components, options);	// will throw if options says so
				if (Temporal.PlainDate.compare (testDate.withCalendar("gregory"), this.firstSwitchDate) < 0) throw WesternCalendar.invalidEra
				else {
					let myFields = testDate.getISOFields();
					return new Construct (myFields.isoYear, myFields.isoMonth, myFields.isoDay, this)
				}
			}
			else {	// user says an era of Julian calendar.
				if (components.era == this.eras[1]) components.era = this.julianCalendar.eras[1];	// "as" is rejected with the plain julian calendar.
				components.calendar = this.julianCalendar;
				testDate = Temporal.PlainDate.from (components, options);
				let myFields = testDate.getISOFields();
				return new Construct (myFields.isoYear, myFields.isoMonth, myFields.isoDay, this)
			}
		}
	yearMonthFromFields (askedComponents, options, Construct=Temporal.PlainYearMonth) {// options = {overflow : "constrain"}
		var components = { year : askedComponents.year, month : askedComponents.month, day : 1 }; // set to the first day of month in Julian calendar
		if (askedComponents.era != undefined) components.era = askedComponents.era;
		let myDate = this.dateFromFields(components, options);
		let myISOFields = myDate.getISOFields(); // should be the calendar's field normalised, or with error thrown
		return new Construct(myISOFields.isoYear, myISOFields.isoMonth, this, myISOFields.isoDay);
	}
	monthDayFromFields (askedComponents, options, Construct=Temporal.PlainMonthDay) { // options = {overflow : "constrain"}
		var components = { year : 2000, month : askedComponents.month, day : askedComponents.day }; 
		let myDate = this.dateFromFields(components, options);
		let myISOFields = myDate.getISOFields();
		return new Construct(myISOFields.isoMonth, myISOFields.isoDay, this, myISOFields.isoYear);
	}
	/* Methods for Temporal date-like properties
	*/
	era (date) { 
		return this.fieldsFromDate(date).era 
	}
	eraYear (date) { // Compute unambiguous signed year 
		return this.fieldsFromDate(date).eraYear
	}
	year (date) {
		return this.fieldsFromDate(date).year
	}
	month (date) {
		return this.fieldsFromDate(date).month
		}
	day (date) {
		return this.fieldsFromDate(date).day
		}
	dayOfWeek (date) {
		return this.fullFieldsFromDate(date).dayOfWeek
	}
	dayOfYear (date) { 
		return 1 + JDISO.toCounter (date.getISOFields()) - JDISO.toCounter (this.dateFromFields ({ year : this.year(date), month : 1, day : 1}).getISOFields());
	}
	weekOfYear (date) {
		return this.fullFieldsFromDate(date).weekOfYear
	}
	daysInWeek (date) { return 7 }
	daysInMonth (date) { 
		var index = JDISO.toCounter (date.getISOFields()),
			fields = this.fieldsFromDate(date), 
			lastJulianFields = {year : this.year(this.lastJulianDate), month : this.lastJulianDate.month },
			firstGregorianFields = this.switchingDate.getISOFields(), //year : this.switchingDate.isoYear, month : this.switchingDate.isoMonth
			firstInSwitchingMonth = this.dateFromFields ({day : 1, month : lastJulianFields.month, year : lastJulianFields.year }),
			lastAfterSwitching = this.dateFromFields 
				({day : this.switchingDate.withCalendar("gregory").daysInMonth, month : this.switchingDate.withCalendar("gregory").month, year : this.switchingDate.withCalendar("gregory").year}),
			dur = Temporal.Duration.from("P0D");
		if (fields.year == lastJulianFields.year && fields.month == lastJulianFields.month) {
			try { 
				dur = this.dateUntil( firstInSwitchingMonth,
				this.dateFromFields ({day : JulianCalendar.internalDaysInMonth (lastJulianFields.month, Chronos.isJulianLeapYear(lastJulianFields.year)), 
				month : lastJulianFields.month, year :lastJulianFields.year }, {overflow : "reject"} ),  
				{largestUnit : "days"})
			}
			catch (e) { // overflow errors shows that the ordinary last day in month does not even exist that year.
				dur = this.dateUntil( firstInSwitchingMonth, this.lastJulianDate, {largestUnit : "days"})
			}
		}
		if (fields.year == firstGregorianFields.isoYear && fields.month == firstGregorianFields.isoMonth) {
			try { 
				dur = this.dateUntil(
					this.dateFromFields ({day : 1, month : firstGregorianFields.isoMonth, year :firstGregorianFields.isoYear }, {overflow : "reject"}), 
					lastAfterSwitching,
					{largestUnit : "days"})
			}
			catch (e) { // overflow errors shows that the ordinary last day in month does not even exist that year.
				dur = this.dateUntil ( this.switchingDate, lastAfterSwitching, {largestUnit : "days"} )
			}
		}
		if (dur.days != 0) return dur.days + 1
		else if (index < this.switchingJD)
			return JulianCalendar.internalDaysInMonth (fields.month, Chronos.isJulianLeapYear(fields.year))
			else return date.withCalendar("gregory").daysInMonth
	}
	daysInYear (date) { //
		let fields = this.fieldsFromDate(date),
			dur = this.dateUntil (
				this.dateFromFields({year : fields.year, month : 1, day : 1}),
				this.dateFromFields({year : fields.year, month : 12, day : 31}),
				{largestUnit : "days"});
		return dur.days + 1
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) { // a same year, like 1700 for a switching date that year, may be leap at the begining, then common.
		let y = date.year;
		switch (date.era) {
			case this.eras[0] : y = 1 - y;	// set y as an unambiguous year and continue
			case this.eras[1] : return Chronos.isJulianLeapYear(y); 
			case this.eras[2] : return Chronos.isGregorianLeapYear(y);
		}
/*		let fields = this.fieldsFromDate(date), y = fields.year;
		switch (fields.era) {
			case this.eras[0] : y = 1 - y;	// set y as an unambiguous year and continue
			case this.eras[1] : return Chronos.isJulianLeapYear(y); 
			case this.eras[2] : return Chronos.isGregorianLeapYear(y);
		}
*/
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
	dateAdd (date, duration, options, Construct=Temporal.PlainDate) {// Add a +/- duration - //options={overflow:"constrain"}
		let components = this.fieldsFromDate(date), 
			addedYearMonth = Chronos.divmod ( components.month + duration.months - 1, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + 1; 
		delete components.era; delete components.eraYear;
		// overflow option handled in trying to build new date
		let dateOne = this.dateFromFields (components, options, Construct); // stated options will do the job. 
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
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) {  //
		switch (Temporal.PlainDate.compare(smaller, larger)) {
			case 1 : // 
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
			case -1 :{
				let myLarger = { year : larger.calendar.year(larger), month : larger.month, day : larger.day },
					mySmaller = { year : smaller.calendar.year(smaller), month : smaller.month, day : smaller.day },
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
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		let fields = this.fieldsFromDate(date);
		return "[" + this.id + "] " + fields.day + "/" + fields.month + "/" 
			+ (fields.year) + " " + fields.era 
	}
}// end of calendar class

const
	milesian = new MilesianCalendar ("milesian"),
	julian = new JulianCalendar ("julian"),
	vatican = new WesternCalendar ("vatican","1582-10-15"),
	french = new WesternCalendar ("french","1582-12-20"),
	german = new WesternCalendar ("german","1700-03-01"),
	english = new WesternCalendar("english","1752-09-14");

