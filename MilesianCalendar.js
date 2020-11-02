/* Milesian calendar as Temporal subclass of ISO8601
	Character set is UTF-8
	The Milesian calendar as a Temporal, to be manually imported, set properties to object Date for the Milesian calendar.
Required
	Package Chronos
	TemporalEnvironment: define monthBase and Julian Day computations
Contents: 
	MilesianCalendar: a subclass of Temporal.Calendar
	method toDateString is added - just to facilitate control.
Comments: JSDocs comments to improve.
*/
/*Versions: M2020-11-06
	Source: since 2017
	M2020-11-03
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
class MilesianCalendar extends Temporal.Calendar { 
	constructor (name) {
		super ("iso8601");
		this.name = name;
		this.updateRegister (MilesianCalendar.originDate); 	// Initiate register
	}
	/* Basics
	*/
	// monthBase = 1 	// Temporal convention, for use in controls
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
			{name : "month", init : 1},
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
	/* Origin date and last date worked out
	*/
	static originDate = Temporal.Date.from ("-000001-12-22") // This information should probably be part of params object
	// registerDate = Temporal.Date.from ("0000-01-01") // initiated with a different figure, in order to be initiated with constructor.
	register = { year : 0, month : 1, day : 1, index : 0,	
			weekOfYear : 0, dayOfWeek : 0, weekYearOffset : 0, weeksInYear : 0 }   
	/* Basic mechanism to set the Milesian date components from a standard date given. 
	 Avoid redoing computations at each call for a same date.
	*/
	updateRegister (date) { // update internal register to date given as a parameter.
		let index = dateEnvironment.isoJD.toJulianDay (date.getISOFields());
		if (index !=  this.register.index) {
			this.register.index = index;
			this.register = Object.assign (this.register, this.milesianClockwork.getObject (this.register.index));
			// this.registerDate = Temporal.Date.from (date, {overflow : "reject"});
			// Week figures computations.
			let weekCharacFields = { year : this.register.year, month : this.monthBase, day : 7 },
				weekCharacIndex = this.milesianClockwork.getNumber(weekCharacFields);	// Day index of one day in week 1 for this year
			[this.register.weekOfYear, this.register.dayOfWeek, this.register.weekYearOffset, this.register.weeksInYear] 
				= this.milesianClockwork.getWeekFigures (this.register.index, weekCharacIndex, this.register.year);
		}
	}
	/* Main date generator from Milesian date elements. 
	 Note that the Temporal.Date object shall be initiated 
	 with the ISO representation.
	*/ 
	dateFromFields (askedComponents, askedOptions = {overflow : "constrain"}, Construct = Temporal.Date) {
		var components = { ...askedComponents}, options = {...askedOptions};
		switch (options.overflow) {
			case undefined : options.overflow = "constrain"; 
			case "constrain" : case "balance" : case "reject" : break;
			default : throw MilesianCalendar.invalidOption;
		}
		// NaN or non-integer shall be thrown in Chronos.
		if (components.month < this.monthBase || components.month > this.monthBase + 11) throw MilesianCalendar.outOfRangeDateElement; // always reject months indication that cannot be handled
		// if (components.day < 1) throw MilesianCalendar.dateUnderflow;
		let overflow = 
			components.day < 1
			|| components.day > 31
			|| (components.day > 30 
				&& ( components.month % 2 == 1 || (components.month == 12 && !MilesianCalendar.internalIsLeapYear (components.year))));
		if (overflow && options.overflow == "reject") throw MilesianCalendar.dateOverflow;
		if (overflow && options.overflow == "constrain") {
			components.day = Math.min (components.day, 
				(( components.month % 2 == 1 || (components.month == 12 && !MilesianCalendar.internalIsLeapYear (components.year))) ? 30 : 31));
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
	/* Methods for Date
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
		let m = this.register.month - this.monthBase;
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
		let m = this.register.month - this.monthBase;
		return m % 2 == 0 ? 30 : ( m == 11 && !MilesianCalendar.internalIsLeapYear (this.register.year) ? 30 : 31)
	}
	monthsInYear (date) { return 12 }
	static internalIsLeapYear (year) {
		return Chronos.isGregorianLeapYear (year+1)
		}
	inLeapYear (date) {
		this.updateRegister (date);
		return MilesianCalendar.internalIsLeapYear (this.register.year)
	}
	/* Methods for use with Duration.
	In solar calendars, the only case where "reject" would throw shall be
		duration in year and months only
		keeping the same day (31) would make change to the next month.
	In all other cases, the request is to add days to a date, so reject mode is cancelled and effective mode is balance.
	*/
	dateAdd (date, duration, options={overflow:"constrain"}, Construct) {// Add a +/- duration - 
		this.updateRegister(date);
		// take years months and weeks apart, 
		// This does not work called from Date object: let myDuration = duration.with ({years: 0, months: 0, weeks: 0}, {overflow: "balance"});
		let myDuration = Temporal.Duration.from (duration, {overflow: "balance"}); // balance HMS to days. Other fields are not affected.
		let days = duration.weeks*this.daysInWeek() + duration.days; // effective days to add, including regular weeks
		myDuration = new Temporal.Duration 
			({years : duration.years, 
			months: duration.months, 
			days: duration.weeks*this.daysInWeek() + myDuration.days}); // duration.days balanced with HMS of original duration
		let components = {...this.register};
		let addedYearMonth = Chronos.divmod ( this.register.month + duration.months - this.monthBase, 12 );
		components.year += (duration.years + addedYearMonth[0]); 
		components.month = addedYearMonth[1] + this.monthBase; 
		// handle overflow option
		if (myDuration.days == 0 && date.days == 31 
			&& (components.month % 2 == 1 || (components.month == 12 && !MilesianCalendar.internalIsLeapYear(components.year))))
			switch (options.overflow) {
				case "constrain" : components.day = 30; break;
				case "reject" : throw MilesianCalendar.dateOverflow; break;
				default : throw MilesianCalendar.invalidOption; 
			}
			else components.day += duration.days + myDuration.days;
		return this.dateFromFields (components, {overflow : "balance"}, Construct); 
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
					case "days"  : 
					case "auto"  : return Temporal.Duration.from({ days: myDayOffset }); break;
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