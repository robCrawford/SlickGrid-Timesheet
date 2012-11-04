/**
 * Server-side/client-side session handling for SlickGrid.
 * Currently stores column order, sort, and visibility.
 *
 * TODO: store filters and column widths
 *
 * Example client-side usage:
 *     gridSession = new Slick.Session('myTable', columns);
 *
 * Example server-side usage:
 *     gridSession = new Slick.Session('myTable', columns, { loadFrom: '/session/load', saveTo: '/session/save' });
 *
 * Dependencies for client-side handling:
 *   - jquery.cookie-1.0.js
 *   - jquery.json-2.2.min.js
 */

;(function($) {
    function Session(id, columns, options) {

        var Grid = null;    // Grid instance

        var sid = 'SlickGridSession';
        var session;
        var ie6or7 = /MSIE (6|7)/i.test(navigator.userAgent);

        var defaults = {
            loadFrom: null,
            saveTo: null
        };

        function init() {
            setOptions();
            load();
            if (session && session[id]) {
                restoreColumns();
                return;
            }
            resetSession();
            storeSession(columns);
        }

        function setOptions() {
            options = $.extend({}, defaults, options);
            if (options.loadFrom && !options.saveTo) {
                options.saveTo = options.loadFrom;
            }
            if (options.saveTo && !options.loadFrom) {
                options.loadFrom = options.saveTo;
            }
        }

        function load() {
            if (options.loadFrom) {
                session = $.ajax({
                    async: false,
                    url: options.loadFrom
                }).responseText;
            }
            else {
                session = $.cookie(sid);
            }
            // IE6/7 chokes on the parseJSON call. still investigating why.
            session = (session && !ie6or7) ? $.parseJSON(session) : {};
        }

        function save() {
            if (options.saveTo) {
                $.ajax({
                    data: 'json=' + $.toJSON(session),
                    type: 'POST',
                    url: options.saveTo
                });
            }
            else {
                $.cookie(sid, $.toJSON(session), { expires: 365, path: '/' });
            }
        }

        function resetSession() {
            session = {};
        }

        function restoreColumns() {
            if (session[id].length != columns.length) {
                return;
            }
            var buffer = [];
            for (var i in session[id]) {
                var s = session[id][i];
                for (var c = 0; c < columns.length; c++) {
                    if (s.id == columns[c].id) {
                        columns[c].visible = (s.v) ? true : false;
                        if (s.s) {
                            columns[c].defaultSort = s.s;
                        }
                        else if (columns[c].defaultSort) {
                            delete columns[c].defaultSort;
                        }
                        buffer.push(columns[c]);
                        break;
                    }
                }
            }
            columns = buffer;
        }

        function storeSession(columns) {
            session[id] = [];
            for (var i = 0; i < columns.length; i++) {
                session[id].push({
                    id: columns[i].id,
                    s: columns[i].defaultSort,
                    v: columns[i].visible
                });
            }
        }

        /* Public methods */

        function getColumns() {
            return columns;
        }

        function setGrid(target) {
            Grid = target;
        }

        function saveColumns() {
            load();
            var columns = Grid.getAllColumns();
            storeSession(columns);
            save();
        }

        function saveSort(column, ascending) {
            load();
            var columns = Grid.getAllColumns();
            for (var i = 0; i < columns.length; i++) {
                if (columns[i].defaultSort) {
                    delete columns[i].defaultSort;
                }
                if (column.id == columns[i].id) {
                    columns[i].defaultSort = (ascending) ? 'ascending' : 'descending';
                }
            }
            storeSession(columns);
            save();
        }

        init();

        return {
            // Methods
            "setGrid":          setGrid,
            "getColumns":       getColumns,
            "saveColumns":      saveColumns,
            "saveSort":         saveSort
        };
    }

    // Slick.Session
    $.extend(true, window, { Slick: { Session: Session }});

})(jQuery);
