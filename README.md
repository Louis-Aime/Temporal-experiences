# Temporal-experiences
Applications using the draft Temporal environment

Some use cases of the draft Temporal environement, in particular Temporal.Calendar.

Temporal polyfill as of Spring 2021

## File contents
The .js files consists in:
* chronos: utilities for calendrical computations, including the "Cycle Based Calendar Computation Engine".
* calendars: several class objects and instantiated constant implementing Temporal functions in connection with Temporal.Calendar.
No calendar is defined as an extension of Temporal.Calendar
  * JDISO : instantiate IsoCounter in order to convert Julian Day to Iso fields and the reverse.
  * isoWeeks: instantiate WeekClock in order to get the week fields for the ISO 8601 calendar.
  * MilesianCalendar: a class defining the Milesian calendar computations (id="milesian").
  * JulianCalendar: a class for the Julian Calendar computations (id="julian").
  * WesternCalendar: a framework class for calendars of Europe: a step with the Julian calendar, then a switch to the Gregorian calendar.
* examples: initialisation + a set of calendars, date fields objects, dates, duration, to facilitate tests.
  * milesian: an instance of MilesianCalendar.
  * julian: an instance of JulianCalendar.
  * vatican (id="vatican"): the calendar of the catholic church, that switched to Gregorian on 1582-10-15.
  * french (id="french"): the calendar of France, that switched on 1582-12-20.
  * german (id="german"): the calendar of most protestant german state, that swtiched on 1700-03-01. Test whether this year was a leap year or not...
  * english (id="english"): the calendar of England, that switched on 1752-09-14.
  * swiss (id="swiss"): the calendar of Switzerland, that switched on 1701-01-12; the day before was 31 Dec. 1700 (julian).

The HTML files collects the TC39 Temporal environment.

## Usage
Use the web console.
Use the variables defined in Examples.js to begin with.

Check that 1700 in protestant Germany was a leap year until February, but a common year in March and after.
You may try B.C. years.

Check the week fields (in particular weeksInYear end 2020 versus begin of 2021), there is a bug in the standard gregory calendar.

Ready-to-use environment on [this GitHub pages site.](https://louis-aime.github.io/Temporal-experiences/)
