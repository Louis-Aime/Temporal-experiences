/* Milesian calendar as Temporal subclass of ISO8601
	Character set is UTF-8
	The Milesian calendar as a Temporal, to be manually imported, set properties to object Date for the Milesian calendar.
Contents: 
	MilesianCalendar: a plain class with all properties and method of a Temporal.Calendar
	method toDateString is added - just to facilitate control.
Comments: JSDocs comments to improve.
*/
/* Version: M2020-11-14 - improve Duration methods
	M2020-11-13-2 - make an autonomous class
	M2020-11-13 - dateEnvironment used
	M2020-11-06
	M2020-11-03
	Source: since 2017
*/
/* Required
	Package Chronos
	A file with dateEnvironment; an object with monthBase (0 or 1) and Julian Day computations
*/
/* Copyright Miletus 2016-2020 - Louis A. de FOUQUIERES
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
class MilesianCalendar { /* does not extend Temporal.Calendar */  
	constructor (name) {
		this.id = "milesian";	// this is of the same level as i"so8601", "gregory" etc.
		this.name = name;		// may provide an alernate name
		this.updateRegister (MilesianCalendar.originDate); 	// Initiate register
	}
	/* Basics for interaction with Temporal objects (this.id is forced in constructor)
	*/
	fields (theFields) {return theFields} // nothing to add to the standard fields year, month, day
	toString () {return this.id}
	static from (thing) {return Temporal.Calendar.from(thing)}	// This should not be used, but just in case.
	/* Basic calendar-specific objects 
	*/
	static invalidOption = new RangeError ("unknown option")
	static dateUnderlow = new RangeError ("date element underflow")
	static outOfRangeDateElement = new RangeError ("date element out of range") // month or era out of specified range for calendar
	static dateOverflow = new RangeError ("invalid date") // thrown in case of overflow : reject option
	static mixingCalendar = new TypeError ("until or since operation requires same calendar")
	milesianClockwork = new Chronos ( { // To be used with day counter from M000-01-01 ie ISO -000001-12-22. Decompose into Milesian year, month, day.
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
			{name : "year", init : 0},
			{name : "month", init : dateEnvironment.monthBase},
			{name : "day", init : 1}
		]
		},	// end of calendRule
		{	// weekdayRule
			originWeekday: 4, 		// Use day part of Posix timestamp, week of day of 1970-01-01 is Thursday
			daysInYear: (year) => (Chronos.isGregorianLeapYear( year + 1 ) ? 366 : 365),		// leap year rule for Milesian calendar
			startOfWeek : 0,		// week start with 0
			characWeekNumber : 0,	// we have a week 0 and the characteristic day for this week is 7 1m.
			dayBase : 0,			// use 0..6 display for weekday
			weekBase : 0,			// number of week begins with 0
			weekLength : 7			// the Milesian week is the 7-days well-known week
		}
		)	// end of parameter list
	/* Internal objects: Origin date and last date worked out
	*/
	static originDate = Temporal.Date.from ("-000001-12-22") // This information should probably be part of params object
	register = {	//This internal objects avoids redoing computations at each call of properties for a same date.
		year : 0, month : 1, day : 1, index : 0,	
		weekOfYear : 0, dayOfWeek : 0, weekYearOffset : 0, weeksInYear : 0 }   
	updateRegister (date) { // update internal register to date given as a parameter.
		let index = dateEnvironment.isoJD.toJulianDay (date.getISOFields());
		if (index !=  this.register.index) {
			this.register.index = index;
			this.register = Object.assign (this.register, this.milesianClockwork.getObject (this.register.index));
			// this.registerDate = Temporal.Date.from (date, {overflow : "reject"});
			// Week figures computations.
			let weekCharacFields = { year : this.register.year, month : dateEnvironment.monthBase, day : 7 },
				weekCharacIndex = this.milesianClockwork.getNumber(weekCharacFields);	// Day index of one day in week 1 for this year
			[this.register.weekOfYear, this.register.dayOfWeek, this.register.weekYearOffset, this.register.weeksInYear] 
				= this.milesianClockwork.getWeekFigures (this.register.index, weekCharacIndex, this.register.year);
		}
	}
	/* Main date and Temporal objects generator from fields representing a Milesian date. 
	 Note that the Temporal.Date object shall be initiated 
	 with the ISO representation.
	*/ 
	dateFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct = Temporal.Date) {
		var components = { ...askedComponents}, options = {...askedOptions};
		switch (options.overflow) {
			case undefined : options.overflow = "constrain"; 
			case "constrain" : case "reject" : break;		// case "balance" is not authorised
			default : throw MilesianCalendar.invalidOption;
		}
		// NaN or non-integer shall be thrown from Chronos.
		if (components.month < dateEnvironment.monthBase || components.month > dateEnvironment.monthBase + 11) throw MilesianCalendar.outOfRangeDateElement; // always reject months indication that cannot be handled
		// if (components.day < 1) throw MilesianCalendar.dateUnderflow;
		let overflow = 
			components.day < 1
			|| components.day > 31
			|| (components.day > 30 
				&& ( components.month % 2 == 1 || (components.month == 12 && ! Chronos.isGregorianLeapYear (components.year + 1))));
		if (overflow && options.overflow == "reject") throw MilesianCalendar.dateOverflow;
		if (overflow && options.overflow == "constrain") {
			components.day = Math.min (components.day, 
				(( components.month % 2 == 1 || (components.month == 12 && ! Chronos.isGregorianLeapYear (components.year + 1))) ? 30 : 31));
			components.day = Math.max (components.day, 1);
		}
		// compute index from elements, but do not save this date, nor the index.
		let index = this.milesianClockwork.getNumber(components), // Date elements first tested.
			isoFields = dateEnvironment.isoJD.toIsoFields (index);
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
		components.year = 1999;		// a Milesian long year after Unix epoch, following the most complex rule
		let myDate = this.dateFromFields(components, askedOptions);
		let myFields = myDate.getISOFields();
		return new Construct(myFields.isoMonth, myFields.isoDay, this, 1999);
	}
	/* Methods for Temporal.Date (and also for legacy Date)
	*/
	year (date) {
		this.updateRegister (date);
		return this.register.year
	}
	month (date) {
		this.updateRegister (date);
		return this.register.month
	}
	day (date) {
		this.updateRegister (date);
		return this.register.day
		}
	era (date) { return undefined }
	daysInWeek (date) {return 7}
	dayOfWeek (date) {
		this.updateRegister (date);
		return this.register.dayOfWeek
		// return mod (this.register.index+2, 7) + 1 // originDate (offset 0) is a Wednesday, and weekdays are counted 1 (Monday) to 7 (Sunday)
	}
	daysInYear (date){
		return (this.inLeapYear(date) ? 366 : 365) // this.updateRegister(date) implied
	}
	dayOfYear (date) {
		this.updateRegister(date);
		let m = this.register.month - dateEnvironment.monthBase;
		return this.register.day + 30*(m % 2) + 61*Math.floor (m/2)
	}
	weekOfYear (date) {	
		this.updateRegister(date);
		return this.register.weekOfYear
	} 
	yearOfWeek (date)	{	// Proposal. Year in the week's calendar corresponding to weekOfYear of the date. In fact, weekYearOffset is more general
		this.updateRegister(date);
		return this.register.year + this.register.weekYearOffset
	}
	weekYearOffset (date) {	// Proposal. This is more general than just giving the year.
		this.updateRegister(date);
		return this.register.weekYearOffset
	}
	daysInMonth (date) {
		this.updateRegister(date);
		let m = this.register.month - dateEnvironment.monthBase;
		return m % 2 == 0 ? 30 : ( m == 11 && ! Chronos.isGregorianLeapYear (this.register.year + 1) ? 30 : 31)
	}
	monthsInYear (date) { return 12 }
	inLeapYear (date) {
		this.updateRegister (date);
		return Chronos.isGregorianLeapYear (this.register.year + 1)
	}
	/* Methods for use with Duration.
	duration parameter passed is already set to smallestUnit : days.
	Weeks elements, if existing, are consolidated into days.
	Months and years elements are first added (or subtracted if minus sign) to obtain a date element with same day number.
	Overflow occurs there only if day number does not exist in targer month. In such a case, the "constrain" action is to set the day to the highest existing value.
	Days elements are then added or subtracted to the JD index of the first target date to yield the final targer date.
	*/
	dateAdd (date, duration, options={overflow:"constrain"}, Construct) {// Add a +/- duration - 
		this.updateRegister(date);
		// 1. Build new date components from duration years and months
		let components = {...this.register};
		let addedYearMonth = Chronos.divmod ( this.register.month + duration.months - dateEnvironment.monthBase, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + dateEnvironment.monthBase; 
		// dateFromFields shall handle overflow option
		let dateOne = this.dateFromFields (components, options, Construct);
		// 2. Add or subtract days to final result
		let resultFields = dateEnvironment.isoJD.toIsoFields(dateEnvironment.isoJD.toJulianDay(dateOne.getISOFields()) + duration.weeks*this.daysInWeek(date) + duration.days);
		return new Construct (resultFields.isoYear, resultFields.isoMonth, resultFields.isoDay, this)
	}
	dateSubtract (date, duration, options, Construct) {
		//let myDuration = duration.negated();		// "duration.negated is not a function ???" necessary to construct new object. Because duration may be a "Duration like"
		let myDuration = Temporal.Duration.from(duration).negated();
		return this.dateAdd(date, myDuration, options, Construct) 
	}
	dateUntil (smaller, larger, options={largestUnit:"auto"}) { // name changed from "dateDifference"
		if (smaller.calendar.name != larger.calendar.name) throw MilesianCalendar.mixingCalendar;
		switch (options.largestUnit) {
			case "auto": case "years": case "months": case "weeks": case "days": break; // normally "weeks" should not be implemented
			default : throw MilesianCalendar.invalidOption
		}
		switch (Temporal.Date.compare(smaller, larger)) {
			case 1 : // throw MilesianCalendar.invalidOrder; break;
				let positiveDifference = this.dateUntil (larger, smaller, options);
				return positiveDifference.negated(); break;
			case 0 : return Temporal.Duration("P0D"); break;
			case -1 :{
				let myLarger = { year : larger.year, month : larger.month, day : larger.day },
					mySmaller = { year : smaller.year, month : smaller.month, day : smaller.day },
					myDayOffset = this.milesianClockwork.getNumber(myLarger) - this.milesianClockwork.getNumber(mySmaller),
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
						let weekDayCompound = Chronos.divmod (myDayOffset, smaller.daysInWeek());
						return Temporal.Duration.from({weeks : weekDayCompound[0], days : weekDayCompound[1]}); break;
					case "auto"  : 
					case "days" : return Temporal.Duration.from({ days: myDayOffset }); break;
					default: throw MilesianCalendar.invalidOption
				}
			}
		}
	}
	/* Non standard display method
	*/
	toDateString (date) { // non standard
		this.updateRegister (date);
		let absYear = Math.abs(this.register.year);
		return  "[" + this.name + "]" 
			+ this.register.day + " " + this.register.month + "m " 
			+ ((this.register.year < 0) ? "-": "") 
			+ ((absYear < 100) ? "0" : "") + ((absYear < 10) ? "0" : "") + absYear; 
		}
} // end of calendar object/class