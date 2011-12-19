// emile.js (c) 2009 Thomas Fuchs
// Licensed under the terms of the MIT license.
(function (emile, container) {
    var parseEl = document.createElement('div'),
        ie = !! window.attachEvent && !window.opera,
        props = ('backgroundColor borderBottomColor borderBottomWidth borderLeftColor borderLeftWidth borderRightColor borderRightWidth borderSpacing borderTopColor borderTopWidth bottom color fontSize fontWeight height left letterSpacing lineHeight marginBottom marginLeft marginRight marginTop maxHeight maxWidth minHeight minWidth opacity outlineColor outlineOffset outlineWidth paddingBottom paddingLeft paddingRight paddingTop right textIndent top width wordSpacing zIndex').split(' '),
        handlers = {
            opacity: function (el, v) {
                var s = el.style,
                    v = isNaN(v) ? 0 : v;
                if (ie) {
                    var f = el.currentStyle.filter;
                    if (v == 1) {
                        f = f.replace(/alpha\([^\)]*\)/gi, '') ? s.filter = f : s.removeAttribute('filter');
                        return;
                    }
                    if (!el.currentStyle.hasLayout) s.zoom = 1;
                    s.filter = f.replace(/alpha\([^\)]*\)/gi, '') + 'alpha(opacity=' + ((v < 0.001 ? 0 : v) * 100) + ')';
                } else s.opacity = v.toFixed(3);
            }
        };

    function interpolate(source, target, pos) {
        return (source + (target - source) * pos).toFixed(3);
    }

    function s(str, p, c) {
        return str.substr(p, c || 1);
    }

    function color(source, target, pos) {
        var i = 2,
            j, c, tmp, v = [],
            r = [];
        while (j = 3, c = arguments[i - 1], i--)
        if (s(c, 0) == 'r') {
            c = c.match(/\d+/g);
            while (j--) v.push(~~c[j]);
        } else {
            if (c.length == 4) c = '#' + s(c, 1) + s(c, 1) + s(c, 2) + s(c, 2) + s(c, 3) + s(c, 3);
            while (j--) v.push(parseInt(s(c, 1 + j * 2, 2), 16));
        }
        while (j--) {
            tmp = ~~ (v[j + 3] + (v[j] - v[j + 3]) * pos);
            r.push(tmp < 0 ? 0 : tmp > 255 ? 255 : tmp);
        }
        return 'rgb(' + r.join(',') + ')';
    }

    function parse(val, prop) {
        var p = parseFloat(val),
            q = val.replace(/^[\-\d\.]+/, '');
        return isNaN(p) ? {
            v: q,
            f: (prop in handlers) ? handlers[prop] : color,
            u: ''
        } : {
            v: p,
            f: (prop in handlers) ? handlers[prop] : interpolate,
            u: q
        };
    }

    function normalize(style) {
        var css, rules = {},
            i = props.length,
            v;
        parseEl.innerHTML = '<div style="' + style + '"></div>';
        css = parseEl.childNodes[0].style;
        while (i--) if (v = css[props[i]]) rules[props[i]] = parse(v, props[i]);
        return rules;
    }

    container[emile] = function (el, style, opts) {
        el = typeof el == 'string' ? document.getElementById(el) : el;
        opts = opts || {};
        var target = normalize(style),
            comp = el.currentStyle || getComputedStyle(el, null),
            prop, current = {},
            start = +new Date,
            dur = opts.duration || 200,
            finish = start + dur,
            interval, easing = opts.easing || function (pos) {
                return (-Math.cos(pos * Math.PI) / 2) + 0.5;
            };
        for (prop in target) current[prop] = parse(comp[prop], prop);
        opts.before && opts.before(el, opts);
        interval = setInterval(function () {
            var time = +new Date,
                pos = time > finish ? 1 : (time - start) / dur;
            for (prop in target) {
                if (prop in handlers) {
                    handlers[prop](el, (current[prop].v + (target[prop].v - current[prop].v) * easing(pos)));
                } else {
                    el.style[prop] = target[prop].f(current[prop].v, target[prop].v, easing(pos)) + target[prop].u;
                }
            }
            if (time > finish) {
                clearInterval(interval);
                opts.after && opts.after(el, opts);
            } else {
                opts.during && opts.during(el, opts);
            }
        }, 10);
    }
})('emile', this);
