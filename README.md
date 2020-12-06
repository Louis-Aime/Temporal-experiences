# Temporal-experiences
Applications using the draft Temporal environment

Some use cases of the draft Temporal environement, in particular Temporal.Calendar.

Temporal polyfill as of 13 November 2020

## File contents
The .js files consists in:
* Chronos: utilities for calendrical computations, including the "Cycle Based Calendar Computation Engine".
* Calendars: several class objects and instantiated constant implementing Temporal functions in connection with Temporal.Calendar.
No calendar is defined as an extension of Temporal.Calendar
  * MilesianCalendar: a class defining the Milesian calendar computations (id="milesian")
  * JulianCalendar: a class for the Julian Calendar computations (id="julian")
  * WesternCalendar: a framework class for calendars of Europe: a step with the Julian calendar, then a switch to the Gregorian calendar.
  * milesian: an instance of MilesianCalendar.
  * julian: an instance of JulianCalendar.
  * vatican (id="vatican"): the calendar of the catholic church, that switched to Gregorian on 1582-10-15
  * french (id="french"): the calendar of France, that switched on 1582-12-20
  * german (id="german"): the calendar of most protestant german state, that swtiched on 1700-03-01. Test whether this year was a leap year or not...
  * english (id="english"): the calendar of England, that switched on 1752-09-14. 
* Examples: a set of date fields,  dates, duration, to facilitate tests.

The HTML files collects the TC39 Temporal environment.

## Usage
Use the web console.
Use the variables defined in Examples.js to begin with.

Check that 1700 in protestant Germany was a leap year until February, but a common year in March and after.
You may try B.C. years.

Check the week fields (in particular weeksInYear end 2020 versus begin of 2021), there is a bug in the standard gregory calendar.

As of 2020-11-13: 
* All expectped methods are implemented in MilesianCalendar, JulianCalendar, WesternCalendar classes, except method on Time objects.

Ready-to-use environment on [this GitHub pages site.](https://louis-aime.github.io/Temporal-experiences/)
