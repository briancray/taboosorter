/*
 * TabooSorter is a fast, lightweight table sorter
 *
 * OPTIONS (all optional):
 *  initial_column: Index of initial column to sort. defaults to 0
 *  columns: header length array of dictionaries that hold column settings
 *      order: initial order to sort by, 'asc' or 'desc'. defaults to 'asc'
 *      sort: type of sorter, 'text', 'number', 'date', or false to disable sorting. defaults to 'text'
 *  zebra_classes: 2 item array of odd and even classes, or false to skip. defaults to ['odd', 'even']
 *  header_classes: 3 item array of header sort classes, ascending class, and descending class. defaults to ['sort', 'asc', 'desc']
 *
 * METHODS:
 * .sort(index)
 *
 * LICENSE:
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */


(function ($) {
    var inf = Number.POSITIVE_INFINITY;

    $.taboosorter = function (el, settings) {
        var t = this;
        $.extend(t.settings, settings || {});
        t.el = el;
        t._build_column_settings();
        t.sort();
        t._add_classes();
        t._listen();
        $(t.el).data('sorter', this);
    };

    $.taboosorter.prototype = {
        constructor: $.taboosorter,

        settings: {
            initial_column: 0,
            zebra_classes: ['odd', 'even'],
            header_classes: ['sort', 'asc', 'desc'],
            columns: [],
            defaults: {
                order: 'asc',
                sort: 'text'
            }
        },

        sorters: {
            text: function (a, b) {
                return a > b ? 1 : a < b ? -1 : 0;
            },
            number: function (a, b) {
                a = a * 1;
                b = b * 1;
                a = a != a ? inf : a;
                b = b != b ? inf : b;
                    
                return a - b;
            },
            date: function (a, b) {
                var da = +(new Date(a)),
                    db = +(new Date(b));
                    
                da = da != da ? inf : da;
                db = db != db ? inf : db;
                return da - db;
            }
        },

        sort: function (index) {
            var t = this,
                el = $(t.el);
            index = index == undefined ? t.settings.initial_column : index,

            el.trigger('sort_start');
            t._sort_column(index);
            el.trigger('sort_end');
        },

        _listen: function () {
            var t = this,
                class_name = t.settings.header_classes[0];

            $(t.el).on('click', '.' + class_name, function (e) {
                t.sort($(this).index());
            });
        },

        _add_classes: function () {
            var t = this,
                settings = t.settings,
                columns = settings.columns,
                class_name = settings.header_classes[0],
                el = t.el,
                table_headers = $(el.getElementsByTagName('thead')[0].rows[0].cells);
                x = table_headers.length;

            while (x--) {
                columns[x].sort && table_headers.eq(x).addClass(class_name);
            }
        },

        _build_column_settings: function () {
            var t = this,
                settings = t.settings,
                el = t.el,
                table_headers = el.getElementsByTagName('thead')[0].rows[0].cells,
                defaults = settings.defaults,
                columns = settings.columns || [],
                x = table_headers.length;

            while (x--) {
                columns[x] = $.extend(true, {}, defaults, columns[x]);
            }
        },

        _extract: function () {
            return (this.getAttribute('data-sortval') || this.textContent || this.innerText || '').toLowerCase();
        },

        _sort_column: function (index) {
            var t = this,
                extract = t._extract,
                settings = t.settings,
                column = settings.columns[index],
                column_sorter = typeof column.sort == 'function' ? column.sort : t.sorters[column.sort],
                order = column.order,
                next_order = order == 'asc' ? 'desc' : 'asc',
                header_classes = settings.header_classes,
                sort_classes = {asc: header_classes[1], desc: header_classes[2]},
                zebra = settings.zebra_classes,
                el = t.el,
                table_body = el.getElementsByTagName('tbody')[0],
                table_body2 = table_body.cloneNode(false),
                table_rows = table_body.rows,
                table_row_count = table_rows.length,
                table_rows2 = new Array(table_row_count),
                sorting_index = new Array(table_row_count),
                table_headers = $(el.getElementsByTagName('thead')[0].rows[0].cells),
                table_header_count = table_headers.length,
                header_class,
                x = 0,
                sorter_function = function (a, b) {
                    var sorted = column_sorter(a[1], b[1]);
                    return order == 'asc' ? sorted : -sorted;
                };

            for (; x < table_row_count; x++) {
                sorting_index[x] = [x, extract.call((table_rows2[x] = table_rows[x]).cells[index])];
            }

            sorting_index.sort(sorter_function);
            
            for (x = 0; x < table_row_count; x++) {
                table_body2.appendChild(table_rows2[sorting_index[x][0]]);
            }
            
            if (zebra) {
                var $rows = $(table_body2).children('tr');
                $rows.filter(':odd').addClass(zebra[1]).removeClass(zebra[0]);
                $rows.filter(':even').addClass(zebra[0]).removeClass(zebra[1]);
            }

            el.replaceChild(table_body2, table_body);

            for (x = 0; x < table_header_count; x++) {
                if (x === index) {
                    table_headers.eq(x).removeClass(sort_classes[next_order]).addClass(sort_classes[order]);
                }
                else {
                    table_headers.eq(x).removeClass(sort_classes[next_order]).removeClass(sort_classes[order]);
                }
            }

            column.order = next_order;
        }
    };

    $.fn.taboosorter = function (settings) {
        return this.each(function () {
            new $.taboosorter(this, settings);
        });
    };

})(jQuery);
