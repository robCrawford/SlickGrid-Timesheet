# Forked SlickGrid Documentation

## Features added in this fork:

* **Session handling:** Refreshing the page restores column visiibility, order, and default sort.
* **Filtering UI:** Min/max ranges are determined automatically.
* **Rich sorting library:** Sort algorithms are determined automatically.
* **Fixed totals rows:** Can be updated with the Grid.setTotals() method. Filters update totals automatically. Can be displayed in footer and/or header.
* **UX improvements:** Column reordering is updated in ColumnPicker. More natural dragging algorithm/threshold used.

See examples/example15-fork-feature-demo.html for a demo.

## When and Where to Load SlickGrid

SlickGrids are initialized by pushing a definitions object onto the global "dataGrids" array, like so:

    <script type="text/javascript">

        var my_slickgrid = {...};
        dataGrids.push(my_slickgrid);

        $(function() {
            // your jQuery code
        });

    </script>

The dataGrids init process happens on jQuery's ready() event, which is why the following will not work:

    <script type="text/javascript">

        var my_slickgrid = {...};

        $(function() {
            // This won't work!
            dataGrids.push(my_slickgrid);
        });

    </script>

## Column Definitions:

* name                - *Required*. Column name to put in the header.
* field               - Property of the data context to bind to. If missing, this will use the column ID, or the column name.
* id                  - Column ID. If missing, this will use the column field, or the column name.
* toolTip             - Tooltip (if different from name).
* width               - Width of the column in pixels.
* minWidth            - Minimum allowed column width for resizing.
* maxWidth            - Maximum allowed column width for resizing.
* sortable            - (default false) If true, the column can be sorted (onSort will be called).
* forceSortType       - Override automatic sort detection to use a particular sort type.
* resizable           - (default true) If false, the column cannot be resized. Should be used sparingly.
* cssClass            - A CSS class to add to the cell.
* visible             - (default true) If false, the column will be hidden by default, to be made available in a ColumnPicker or other UI element.
* filter              - Which filter method to use for filtering this column. Currently can be set to "text" or "range".
* presets             - An array containing the human-readable column preset(s) this column is part of. "Default" and "All Columns" are implied, assuming showColumnPresets is true.
* total               - (default 'sum') Used to determine how totals are calculated. Currently can only be set to "sum" or "average".
* formatter           - (default 'return value || ""') Function responsible for rendering the contents of a cell. Signature: function formatter(row, cell, value, columnDef, dataContext) { ... return "..."; }
* editor              - An Editor class.
* validator           - An extra validation function to be passed to the editor.
* unselectable        - If true, the cell cannot be selected (and therefore edited).
* cannotTriggerInsert - If true, a new row cannot be created from just the value of this cell.
* rerenderOnResize    - Rerender the column when it is resized (useful for columns relying on cell width or adaptive formatters).
* asyncPostRender     - Function responsible for manipulating the cell DOM node after it has been rendered (called in the background).
* behavior            - Configures the column with one of several available predefined behaviors:  "select", "move", "selectAndMove".
* defaultToAscending  - (default true) If false, the column sorting will default to descending.
* alwaysDisplay       - (default false) If true, the column will not appear in the ColumnPicker and will always be displayed on all presets.

## Usage Example #1, no AJAX

    <script type="text/javascript">

        var my_slickgrid = {
            id: 'mySlickGrid',          // a unique ID for this table, for session handling.
            container: '#slickgrid',    // the existing DOM element that will contain the datagrid. Should have width and height set.
            options: {
                grid: {
                    rowHeight: 21,
                    defaultMinWidth: 80,
                    defaultColumnWidth: 120,
                }
            },
            columns: [
                { name: 'Date', sortable: true, minWidth: 90, defaultSort: 'descending' },
                { name: 'City', filter: 'text', sortable: true, minWidth: 100 },
                { name: 'Clicks', filter: 'range', sortable: true, width: 62 },
                { name: 'CTR', filter: 'range', sortable: true, visible: false, width: 62 }
            ],
            // empty cells don't need to be included in totals
            totals: {
                clicks: Math.round(Math.random() * 1000),
                ctr: Math.round(Math.random() * 100) + '%'
            },
            // data needs to be an array of objects. Each object needs a unique 'id'.
            data: [
                { id: 0, date: '12/24/2007', city: 'Philadelphia', clicks: 1238, ctr: '45%' },
                { id: 1, date: '12/28/2007', city: 'Miami', clicks: 675, ctr: '7%' },
                { id: 2, date: '12/29/2007', city: 'Los Angeles', clicks: 1234, ctr: '1%' },
                { id: 3, date: '11/12/2008', city: 'Boston', clicks: 16, ctr: '99%' }
            ]
        });

        dataGrids.push(my_slickgrid);

    </script>

## Usage Example #2: loading data in later with AJAX (recommended)

    <script type="text/javascript">

        var my_slickgrid = {
            id: 'demoTable',            // a unique ID for this table, for session handling.
            container: '#slickgrid',    // the existing DOM element that will contain the datagrid. Should have width and height set.
            options: {
                grid: {
                    rowHeight: 21,
                    defaultMinWidth: 80,
                    defaultColumnWidth: 120,
                }
            },
            columns: [
                { name: 'Date', sortable: true, minWidth: 90, defaultSort: 'descending' },
                { name: 'City', filter: 'text', sortable: true, minWidth: 100 },
                { name: 'Clicks', filter: 'range', sortable: true, width: 62 },
                { name: 'CTR', filter: 'range', sortable: true, visible: false, width: 62 }
            ],
            // These should be included anyway:
            totals: {},
            data: []
        };

        dataGrids.push(my_slickgrid);

        $(function() {
            $.getJSON('/path/to/ajax', function(data) {
                my_slickgrid.data = data.data;
                my_slickgrid.totals = data.totals;

                my_slickgrid.View.setItems(my_slickgrid.data);
                my_slickgrid.Grid.setTotals(my_slickgrid.totals);
            });
        });

    </script>

This example assumes your AJAX call returns both totals and data in a single JSON object:

    {
        "totals": {
            "clicks": 2345, "ctr": "4%"
        },
        "data": [
            { "id": 0, "date": "12/24/2007", "city": "Philadelphia", "clicks": 1238, "ctr": "45%" },
            { "id": 1, "date": "12/28/2007", "city": "Miami",        "clicks": 675,  "ctr": "63%" },
            { "id": 2, "date": "12/29/2007", "city": "Los Angeles",  "clicks": 1234, "ctr": "11%" },
            { "id": 3, "date": "11/12/2008", "city": "Boston",       "clicks": 16,   "ctr": "99%" }
        ]
    }

If you don't need to display totals, you could just return the data array as JSON:

    [
        { "id": 0, "date": "12/24/2007", "city": "Philadelphia", "clicks": 1238, "ctr": "45%" },
        { "id": 1, "date": "12/28/2007", "city": "Miami",        "clicks": 675,  "ctr": "63%" },
        { "id": 2, "date": "12/29/2007", "city": "Los Angeles",  "clicks": 1234, "ctr": "11%" },
        { "id": 3, "date": "11/12/2008", "city": "Boston",       "clicks": 16,   "ctr": "99%" }
    ]

And then update your SlickGrid like so:

    $(function() {
        $.getJSON('/path/to/ajax', function(data) {
            my_slickgrid.data = data;
            my_slickgrid.View.setItems(my_slickgrid.data);
        });
    });
