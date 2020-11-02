# Temporal-experiences
Applications using the draft Temporal environment

Some use cases of the draft Temporal environement, in particular Temporal.Calendar.

Temporal polyfill as of 2 November 2020

## File contents
The .js files consists in:
* Chronos: utilities for calendrical computations, including the "Cycle Based Calendar Computation Engine".
* TemporalEnvironment: defines that month begin with 1, and a converter between ISO8601 and Julian Day
* MilesianCalendar extends TemporalCalendar. It is a very simple solar calendar. 
Years comprise 12 months of 30 or 31 days alternatively. 
Years begin on 12-21 just before common years, or 12-22 just before leap years
of the iso8601 calendar.
* JulianCalendar extends TemporalCalendar. The plain Julian calendar as used in Europe
until 1582. Two eras: B.C. and A.D. (default).
* WesternCalendar extends TemporalCalendar. Instantiate with 
    * the date string of the transition to Gregorian,
    * a name for future use.
* Calendars: several calendars instantiated from WesternCalendar.
* Examples: a set of date fields and dates.

The HTML files collects the Temporal environment.

## Usage
Use the web console.
Use the variables defined in Examples.js to begin with.

Check that 1700 in protestant Germany was a leap year until February, but a common year in March and after.
You may try B.C. years.

As of 2020-11-02: 
* All expectped methods are implemented in MilesianCalendar and JulianCalendar classes.
* WesternCalendar: only Fields getter and initializers are implemented. No computation using Temporal.Duration.

ready-to-use environment: https://louis-de-fouquieres.pagesperso-orange.fr/Temporal/TemporalTries.html
