import { createElement } from 'react'
import type { SliceReplacements } from '../../registry'
import { CodePickerReplacement } from './CodePicker'
import { MasterTableReplacement } from './MasterTable'
import { MiniCalendarReplacement } from './MiniCalendar'

export const replacements: SliceReplacements = {
  CodePickerSheet: {
    options: [
      {
        label: 'No corner X, Escape clears first (as today)',
        Component: () => createElement(CodePickerReplacement),
        note: 'The first Escape clears a typed search; the next closes the dialog.',
      },
      {
        label: 'Corner X (shadcn default)',
        Component: () => createElement(CodePickerReplacement, { closeX: true }),
        note: 'Adds a visible close button top right; Escape still clears the search first.',
      },
      {
        label: 'Escape closes at once (library default)',
        Component: () => createElement(CodePickerReplacement, { escapeClearsFirst: false }),
        note: 'Escape closes the dialog even with text typed; the clear button still empties the search.',
      },
    ],
    library: 'Base UI Combobox (inline) in shadcn Dialog + TanStack Virtual',
    changes: [
      'Adds combobox and listbox roles, arrow, Home/End and Enter selection, first match highlighted as you type',
      'Adds virtualised rows: only the rows in view render, measured to their wrapped height',
      'Keeps the prototype search (code first, then description words), the 12-row default list and the teal current row',
      'Adds a focus trap and focus restore from the Dialog',
      'Keeps the white 48px search box, in the one shared search look (as NameSearchBox)',
    ],
    status: 'built',
  },
  'Table / Header / TextAction / EditCell': {
    options: [
      {
        label: 'Static headers (as today)',
        Component: () => createElement(MasterTableReplacement),
        note: 'Plain head cells in a fixed name order, as the prototype draws them.',
      },
      {
        label: 'Sortable headers (proposed)',
        Component: () => createElement(MasterTableReplacement, { sortable: true }),
        note: 'Name and Id sort on click, with aria-sort and a direction arrow; starts on Name ascending.',
      },
    ],
    library: 'TanStack Table v9 (row sorting) + shadcn Table; text actions are shadcn Button link',
    changes: [
      'Keeps the compact 12.5px cells, uppercase mist heads and the bordered 14px-radius card',
      'Changes Th/Td/EditCell from four duplicated style objects to one shadcn Table',
      'Changes the Edit cell to a column definition (display column), not a bespoke component',
      'Adds a column model that sorting, visibility or sticky headers can switch on per view',
    ],
    status: 'built',
  },
  'MiniCalendar (RightRail)': {
    options: [
      {
        label: 'Arrows move the day to the 1st (as today)',
        Component: () => createElement(MiniCalendarReplacement),
        note: 'Previous and next select the 1st of that month, so the day view follows.',
      },
      {
        label: 'Arrows change the month only (react-day-picker default)',
        Component: () => createElement(MiniCalendarReplacement, { arrowsMoveSelection: false }),
        note: 'Previous and next only page the grid; the selected day stays until a day is picked.',
      },
    ],
    library: 'shadcn Calendar (react-day-picker 10) with custom MonthCaption and DayButton',
    changes: [
      'Keeps the key bindings: arrows, Home/End in the week, Page Up/Down by month, Shift for a year, all DayPicker built-ins',
      'Changes the grid to a real table (grid role, column headers) instead of a group of buttons',
      'Keeps today filled crimson, the selected day outlined crimson and the ISO week label',
      'Keeps the To-do card below it (the WarningsToDo row\'s replacement); leaves out the Internal notes and Awaiting review cards further down the rail',
    ],
    status: 'partial',
  },
}
