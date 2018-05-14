'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define('dfe-core', function () {
    var arfDatePattern = /^(18|19|20)((\\d\\d(((0[1-9]|1[012])(0[1-9]|1[0-9]|2[0-8]))|((0[13578]|1[02])(29|30|31))|((0[4,6,9]|11)(29|30))))|(([02468][048]|[13579][26])0229))$/;
    //deep
    function deepCopy(to, from) {
        Object.getOwnPropertyNames(from).forEach(function (key) {
            if (key !== 'key') {
                var v = from[key];
                to[key] = (typeof v === 'undefined' ? 'undefined' : _typeof(v)) === 'object' ? deepCopy(Array.isArray(v) ? [] : {}, v) : v;
            }
        });
        return to;
    }

    var nextKey = 0;

    //###############################################################################################################################
    function JsonProxy(data, parents, elements, listener) {
        this.parents = parents || [];
        this.elements = elements || [];
        this.data = data || {};
        this.persisted = data;
        this.data.key || (this.data.key = ++nextKey);
        this.listener = listener;
        if (this.parents.length != this.elements.length) throw 'Oops';
    }

    JsonProxy.prototype.toString = function () {
        return 'JsonProxy{' + this.elements.join('.') + '}';
    };

    /* Queries model from value(s) or subset(s) 
     * @param {String} path full-path string i.e. 'policy.class.code' or relative path like '.code', '..class.code' etc
     * @returns {String|JsonProxy|Array}
     */
    JsonProxy.prototype.get = function (path) {
        var sb = 0;
        if (!path) return this;
        if (path.charAt(0) == '.') {
            var s = path.substr(1),
                ret;
            if (s.indexOf('.') == -1 && s.length > 0) {
                ret = this.data[s];
                this.listener && this.listener.depend(this.data, s);
                if (ret && Array.isArray(ret)) {
                    var t = ret,
                        p = this.parents.concat(this),
                        e = this.elements.concat(s);ret = [];
                    t.forEach(function (d) {
                        ret.push(new JsonProxy(d, p, e, this.listener));
                    }, this);
                }
                return ret || [];
            } else {
                while (s.charAt(sb) == '.') {
                    sb++;
                }var p = this.elements.slice(0, this.elements.length - sb).join('.');
                path = p == '' ? s.substr(sb) : p + path.substr(sb);
            }
            if (sb == s.length) return this.parents.concat(this)[this.parents.length - sb];
        }
        var p = path.split('.'),
            pa = this.parents.concat(this);
        if (path.length == 0) return [new JsonProxy(pa[0].data, [], [], this.listener)];
        var va = [pa[0]],
            maintained = true;
        for (var i = 0; i < p.length && va.length > 0; i++) {
            if (maintained && pa.length - sb > i + 1 && i < p.length - 1 && this.elements[i] == p[i]) {
                va = pa[i + 1].data ? [pa[i + 1]] : [];
            } else {
                var nva = [],
                    e,
                    listener = this.listener;
                va.forEach(function (px) {
                    if (px.data) {
                        if (listener) listener.depend(px.data, p[i]);
                        if (e = px.data[p[i]]) {
                            if (Array.isArray(e)) {
                                var pars = px.parents.concat(px),
                                    els = p.slice(0, i + 1);
                                e.forEach(function (d) {
                                    nva.push((typeof d === 'undefined' ? 'undefined' : _typeof(d)) == 'object' ? new JsonProxy(d, pars, els, listener) : d);
                                });
                            } else {
                                nva.push(e);
                            }
                        }
                    }
                });
                if (maintained && i == p.length - 1 && nva.length) return Array.isArray(e) ? nva : nva[0] || [];
                maintained = false;
                va = nva;
            }
        }
        return va;
    };

    JsonProxy.prototype.shadow = function (path, defaults) {
        if (path.length == 0) {
            return [];
        }
        if (path.charAt(0) == '.') {
            path = this.elements.join('.') + path;
        }
        var p = path.split('.'),
            me = this,
            pa = this.parents.concat(this),
            ret = void 0;
        for (var i = 0; i < p.length; i++) {
            if (!(pa.length > i + 1 && this.elements[i] == p[i])) {
                pa = pa.slice(0, i + 1);
                for (var j = i + 1; j <= p.length; j++) {
                    pa = pa.concat(new JsonProxy(undefined, pa, p.slice(0, j), this.listener));
                }ret = pa.pop();
                break;
            }
        }
        ret = ret || new JsonProxy(undefined, this.parents, p, this.listener);
        (typeof defaults === 'undefined' ? 'undefined' : _typeof(defaults)) === 'object' && deepCopy(ret.data, defaults);
        return [ret];
    };

    JsonProxy.prototype.isShadow = function () {
        return !this.persisted;
    };

    JsonProxy.prototype.persist = function () {
        if (!this.persisted) {
            var lp = this.parents[this.parents.length - 1],
                le = this.elements[this.parents.length - 1],
                arr;
            lp.persist();
            arr = lp.data[le] || (lp.data[le] = []);
            if (arr.indexOf(this.persisted = this.data) == -1) {
                arr.push(this.data);
                this.listener && this.listener.notify(lp.data, le, 'a', this.data);
            }
        }
        return this;
    };

    JsonProxy.prototype.append = function (path, defaults) {
        var ret = this.shadow(path, defaults);
        ret.forEach(function (px) {
            px.persist();
        });
        return ret;
    };

    JsonProxy.prototype.clone = function () {
        var ret = (this.parents.length && this.parents[this.parents.length - 1].append('.' + this.elements[this.elements.length - 1])[0] || new JsonProxy({})).withListener(this.listener);
        deepCopy(ret.data, this.data);
        return ret;
    };

    JsonProxy.prototype.set = function (path, value) {
        if (!path) return;
        if ((typeof path === 'undefined' ? 'undefined' : _typeof(path)) == 'object') {
            for (var i in path) {
                this.set('.' + i, path[i]);
            }return;
        }
        if (Array.isArray(value)) value = value[0];
        value || (value = '');
        if (typeof value == 'number') value = value.toString();
        var listener = this.listener,
            le,
            va,
            maintained = true,
            sb = 0,
            sd;
        if (path.charAt(0) == '.') {
            while (path.charAt(sb + 1) == '.') {
                sb++;
            }path = this.elements.slice(0, this.elements.length - sb).join('.') + path.substr(sb);
            while (path.charAt(0) == '.') {
                path = path.substr(1);
            }
        }
        var p = path.split('.'),
            pa = this.parents.concat(this),
            va = [pa[0]];
        for (var i = 0; i < p.length - 1 && va.length > 0; i++) {
            if (maintained && pa.length - sb > i + 1 && this.elements[i] == p[i]) {
                va = [pa[i + 1]];
            } else {
                var nva = [],
                    e;
                va.forEach(function (px) {
                    if ((e = px.data[p[i]]) == undefined) e = [undefined];
                    if (!Array.isArray(e)) throw 'Unable to overwrite property with subset';
                    e.forEach(function (d) {
                        nva.push(new JsonProxy(d, px.parents.concat(px), p.slice(0, i + 1), listener));
                    });
                });
                maintained = false;
                va = nva;
            }
            value.length && va.forEach(function (px) {
                px.persist();
            });
        }
        le = p.pop();
        va.forEach(function (px) {
            var v = px.data[le],
                old = v;
            if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
                Array.isArray(v) ? px.get('.' + le).forEach(function (px) {
                    px.set(value);
                }) : px.append('.' + le, value);
            } else {
                if (v == undefined || v == []) v = '';
                if (typeof v == 'number') v = v.toString();
                if (v != value) {
                    if (value.length == 0) {
                        delete px.data[le];
                        listener && listener.notify(px.data, le, 'r', old);
                    } else {
                        px.data[le] = value;
                        listener && listener.notify(px.data, le, 'm', old, value.toString());
                    }
                }
            }
        });
    };

    JsonProxy.prototype.detach = function () {
        if (this.persisted && this.parents.length > 0) {
            var p = this.parents[this.parents.length - 1],
                e = this.elements[this.parents.length - 1];
            var arr = p.data[e];
            var idx = arr.indexOf(this.data);
            if (idx != -1) {
                arr.splice(idx, 1);
                arr.length || delete p.data[e];
                this.listener && this.listener.notify(p.data, e, 'd', this.data);
            }
            delete this.persisted; // = undefined;
        }
    };

    JsonProxy.prototype.withListener = function (l) {
        var ret = new JsonProxy(this.data, this.parents, this.elements, l);
        ret.persisted = this.persisted;
        return ret;
    };

    //####################################SUPPORTING FUNCTIONS#######################################################################

    JsonProxy.indexOf = function (pxA, path, value) {
        return Array.isArray(pxA) ? pxA.map(function (a) {
            return a.get(path);
        }).indexOf(value) : pxA.get(path).map(function (a) {
            return a.data;
        }).indexOf(pxA.data);
    };

    JsonProxy.prototype.index = function (depth) {
        depth || (depth = 1);
        return JsonProxy.indexOf(this, '........'.substr(0, depth + 1) + this.elements.slice(this.elements.length - depth, this.elements.length).join('.'));
    };

    /* returns first instance of subset or first item. 
     * @param {String} path full-path string i.e. 'policy.class' or relative path like '.class'
     * @returns {String|JsonProxy} 
     */
    JsonProxy.prototype.first = function (path) {
        var v = this.get(path);return (Array.isArray(v) ? v[0] : v) || [];
    };

    /* retrieves existing value from model, if field doesn't exist, default value is assigned to field in model and returned. 
     * @param {String} path full-path string i.e. 'policy.class' or relative path like '.class'
     * @param {String} _default default value
     * @returns {String|Array}
     */
    JsonProxy.prototype.defaultValue = function (path, _default) {
        var ret = this.get(path);if (ret == 0 && _default) {
            this.set(path, _default);ret = this.get(path);
        }return ret;
    };

    /* similar to JsonProxy::defaultValue, but for subsets. If subset doesn't exist, instance will be added to a model and returned
     * @param {String} path full-path string i.e. 'policy.class.code' or relative path like '.code', '..class.code' etc
     * @param {Object} defaults - pre-populated fields only when appended
     * @returns {Array} array of JsonProxy objects (with a length of at least 1)
     */
    JsonProxy.prototype.defaultSubset = function (path, defaults) {
        var ret = this.get(path);if (ret == 0) {
            this.append(path, defaults);ret = this.get(path);
        }return ret;
    };

    /*
     * @param {Object|JsonProxy} to - object to merge into current object. notifications will dispatched, dependencies on "to" object fields will not be made
     */
    JsonProxy.prototype.mergeShallow = function (to) {
        if (to && typeof to.withListener == 'function') to = to.persisted;
        if (to == this.persisted) return;
        if ((typeof to === 'undefined' ? 'undefined' : _typeof(to)) != 'object') this.detach();else {
            this.persist();
            var k,
                l = this.listener,
                dest = this.data;
            for (var k in dest) {
                to[k] == dest[k] || (l.notify(dest, k, 'm'), dest[k] = to[k]);
            }
        }
    };

    JsonProxy.prototype.hasChild = function (other) {
        var _this = this;

        return this.data === other.data || other.parents.some(function (p) {
            return p.data === _this.data;
        });
    };

    //###############################################################################################################################
    function DfeListener(dependencyMap, control) {
        this.dpMap = dependencyMap || new Map();
        this.control = control;
    }

    DfeListener.prototype.depend = function (data, element) {
        if (this.control) {
            var e = this.dpMap.get(data);
            e || this.dpMap.set(data, e = new Map());
            var l = e.get(element);
            l || e.set(element, l = new Set());
            if (!l.has(this.control)) {
                l.add(this.control);
                this.control.dependencies.push({ data: data, element: element });
            }
        }
    };

    DfeListener.prototype.For = function (control) {
        return new DfeListener(this.dpMap, control);
    };

    DfeListener.prototype.notify = function (data, element, action, d1) {
        var e, s;
        (e = this.dpMap.get(data)) && (s = e.get(element)) && s.forEach(function (cc) {
            cc.notify({ data: data, element: element, action: action, d1: d1 });
        });
        return true;
    };

    DfeListener.prototype.set = function (data, element, value, action) {
        if (data[element] != value) {
            data[element] = value;this.notify(data, element, action, value);
        };return true;
    };
    DfeListener.prototype.get = function (data, element) {
        this.depend(data, element);return data[element];
    };

    var wrapProxy = function () {
        var keys = [];
        for (var key in new JsonProxy()) {
            key === 'listener' || keys.push(key);
        }
        return function (proxy, target, listener) {
            for (var i = keys.length - 1; i >= 0; i--) {
                target[keys[i]] = proxy[keys[i]];
            }target.listener = listener;
            return target;
        };
    }();

    //###############################################################################################################################


    var DOMEvents = [{ name: 'onKeyDown', event: 'keydown' }, { name: 'onKeyUp', event: 'keyup' }, { name: 'onChange', event: 'change' }, { name: 'onClick', event: 'click' }, { name: 'onMouseEnter', event: 'mouseenter' }, { name: 'onMouseLeave', event: 'mouseleave' }, { name: 'onBlur', event: 'blur' }];

    var DOM = function () {
        function DOM() {
            _classCallCheck(this, DOM);
        }

        _createClass(DOM, null, [{
            key: 'reconcileAttributes',
            value: function reconcileAttributes(type, domElement, newAttributes, oldAttributes) {
                if (newAttributes.class != oldAttributes.class) {
                    newAttributes.class === undefined ? domElement.removeAttribute('class') : domElement.setAttribute('class', newAttributes.class);
                }
                if (newAttributes.style != oldAttributes.style) {
                    newAttributes.style === undefined ? domElement.removeAttribute('style') : domElement.setAttribute('style', newAttributes.style);
                }
                if (newAttributes.id != oldAttributes.id) {
                    newAttributes.id === undefined ? domElement.removeAttribute('id') : domElement.setAttribute('id', newAttributes.id);
                }
                if (newAttributes.name != oldAttributes.name) {
                    newAttributes.name === undefined ? domElement.removeAttribute('name') : domElement.setAttribute('name', newAttributes.name);
                }
                DOMEvents.forEach(function (e) {
                    if (newAttributes[e.name] != oldAttributes[e.name]) {
                        typeof oldAttributes[e.name] === 'function' && domElement.removeEventListener(e.event, oldAttributes[e.name], false);
                        typeof newAttributes[e.name] === 'function' && domElement.addEventListener(e.event, newAttributes[e.name], false);
                    }
                });
                if (_typeof(newAttributes.events) === 'object' || _typeof(oldAttributes.events) === 'object') {
                    var newEvents = newAttributes.events || 0,
                        oldEvents = oldAttributes.events || 0;
                    DOMEvents.forEach(function (e) {
                        if (newEvents[e.name] != oldEvents[e.name]) {
                            typeof oldEvents[e.name] === 'function' && domElement.removeEventListener(e.event, oldEvents[e.name], false);
                            typeof newEvents[e.name] === 'function' && domElement.addEventListener(e.event, newEvents[e.name], false);
                        }
                    });
                }
                if (newAttributes.html != oldAttributes.html) {
                    if (oldAttributes.html) {
                        while (domElement.firstChild) {
                            domElement.removeChild(domElement.firstChild);
                        }
                    }
                    var html = newAttributes.html,
                        isArray = Array.isArray(html);
                    html = isArray ? html.filter(function (e) {
                        return !!e;
                    }) : html;
                    if (html && html != 0) {
                        if (isArray) {
                            html[0].nodeName ? html.forEach(function (node) {
                                return domElement.appendChild(node);
                            }) : domElement.innerHTML = html.join('');
                        } else {
                            html.nodeName ? domElement.appendChild(html) : domElement.innerHTML = html.toString();
                        }
                    }
                }
                if (!!newAttributes.disabled != domElement.disabled) {
                    domElement.disabled = !!newAttributes.disabled;
                }
                switch (type) {
                    case '#text':
                        newAttributes.text == oldAttributes.text || (domElement.nodeValue = newAttributes.text);
                        break;
                    case 'input':
                    case 'textarea':
                        newAttributes.type == oldAttributes.type || (domElement.type = newAttributes.type);
                        if (newAttributes.type !== 'checkbox' && newAttributes.type !== 'radio') {
                            if (domElement.value != newAttributes.value) {
                                if (document.activeElement === domElement) {
                                    //TODO - if it s between "keydown" and "keyup" - delay? update / don't update
                                    /*let s = domElement.selectionStart, e = domElement.selectionEnd;
                                    domElement.value = newAttributes.value;
                                    domElement.selectionStart = s;
                                    domElement.selectionEnd = e;*/
                                } else {
                                    domElement.value = newAttributes.value;
                                }
                            }
                        } else {
                            domElement.checked = newAttributes.checked;
                        }
                        break;
                    case 'label':
                        newAttributes.text == oldAttributes.text || (domElement.innerText = newAttributes.text);
                        break;
                    case 'select':
                        newAttributes.selectedIndex == domElement.selectedIndex || (domElement.selectedIndex = newAttributes.selectedIndex);
                        break;
                    case 'option':
                        newAttributes.text == oldAttributes.text || (domElement.text = newAttributes.text);
                        newAttributes.value == oldAttributes.value || (domElement.value = newAttributes.value);
                        break;
                    case 'th':
                    case 'td':
                        (newAttributes.colSpan || 1) == domElement.colSpan || (domElement.colSpan = newAttributes.colSpan || 1);
                        (newAttributes.rowSpan || 1) == domElement.rowSpan || (domElement.rowSpan = newAttributes.rowSpan || 1);
                        break;
                    case 'form':
                        if (newAttributes.action != oldAttributes.action) {
                            newAttributes.action === undefined ? domElement.removeAttribute('action') : domElement.setAttribute('action', newAttributes.action);
                        }
                        if (newAttributes.method != oldAttributes.method) {
                            newAttributes.method === undefined ? domElement.removeAttribute('method') : domElement.setAttribute('method', newAttributes.method);
                        }
                        if (newAttributes.target != oldAttributes.target) {
                            newAttributes.target === undefined ? domElement.removeAttribute('target') : domElement.setAttribute('target', newAttributes.target);
                        }
                        break;
                    case 'iframe':
                        if (newAttributes.src != oldAttributes.src) {
                            newAttributes.src === undefined ? domElement.removeAttribute('src') : domElement.setAttribute('src', newAttributes.src);
                        }
                        break;
                }
            }
        }, {
            key: 'batchRender',
            value: function batchRender(nodes) {
                nodes.forEach(function (node) {
                    return node.render();
                });
            }
        }, {
            key: 'nodeFromElement',
            value: function nodeFromElement(domElement) {
                function isChildOf(parentElement) {
                    if (parentElement) {
                        for (var e = domElement; e; e = e.parentElement) {
                            if (e === parentElement) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                var exploreContent = function exploreContent(content, nodes) {
                    return content.forEach(function (st) {
                        return st.childNode instanceof Node || (nodes.push(st.dom), exploreContent(st.children, nodes));
                    });
                };
                function getContentNodes(node) {
                    if (node.key === 'accountName-22') {
                        node = node;
                    }
                    var ret = [];
                    node.lastRenderStructure.filter(function (lrs) {
                        return lrs.dom;
                    }).forEach(function (st) {
                        return ret.push(st.dom), exploreContent(st.content, ret);
                    });
                    return ret;
                }
                var runtime = null,
                    prnt = domElement;
                while (!runtime && prnt) {
                    runtime = prnt._dfe_runtime;
                    prnt = prnt.parentNode;
                }
                if (runtime) {
                    var ret = null;
                    runtime.nodes.concat().reverse().filter(function (node) {
                        return node.isAttached();
                    }).forEach(function (node) {
                        return ret || getContentNodes(node).some(isChildOf) && (ret = node);
                    });
                    return ret;
                }
                return null;
            }
        }, {
            key: 'makeKeyMap',
            value: function makeKeyMap(renderStructure, lastRenderStructure) {
                if (renderStructure.length > 1 && lastRenderStructure.length > 1 && typeof lastRenderStructure[0].key !== 'undefined') {
                    var keyMap = new Map(),
                        info = void 0;
                    lastRenderStructure.forEach(function (lst) {
                        return (info = keyMap.get(lst.key)) ? info.nodes.push(lst) : keyMap.set(lst.key, { lrs: 0, nodes: [lst] });
                    });
                    return renderStructure.map(function (st) {
                        return (info = keyMap.get(st.key)) && info.nodes[info.lrs++];
                    });
                }
            }
        }]);

        return DOM;
    }();

    var Component = function () {
        function Component(node) {
            _classCallCheck(this, Component);

            this.$node = node;
        }

        _createClass(Component, [{
            key: 'destroy',
            value: function destroy() {}
        }, {
            key: 'update',
            value: function update() {
                this.$node.notify({ action: 'self' });
            }
        }, {
            key: 'doValidation',
            value: function doValidation(events, attrs) {
                return false;
            }
        }, {
            key: 'store',
            value: function store(value, method) {
                this.$node.store(value, method);
            }
        }, {
            key: 'render',
            value: function render(data, error, attributes, children) {
                var sub = [];
                children.forEach(function (map) {
                    return map.forEach(function (child) {
                        return sub.push(child);
                    });
                });
                return sub;
            }
        }, {
            key: 'onUpdate',
            value: function onUpdate(data, error, attributes) {}
        }]);

        return Component;
    }();

    var fieldIndex = 0;

    var Field = function Field(clazz) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        _classCallCheck(this, Field);

        var index = 1,
            parameters = {},
            children = [];
        if (!(clazz.prototype instanceof Component)) {
            throw 'Must specify Component class';
        }
        if (typeof arguments[1] === 'string') {
            name = arguments[1];
            index++;
        } else {
            name = clazz.prototype.constructor.name + '#' + ++fieldIndex;
        }
        var next = arguments[index];
        if ((typeof next === 'undefined' ? 'undefined' : _typeof(next)) === 'object' && !Array.isArray(next) && !(next instanceof Field)) {
            parameters = next;
            index++;
        }
        for (var i = index; i < arguments.length; i++) {
            next = arguments[i];
            (Array.isArray(next) ? next : [next]).forEach(function (arg) {
                return arg instanceof Field && children.push(arg);
            });
        }
        var staticTest = function staticTest(field) {
            return field.class && typeof field.class === 'string';
        };
        _extends(this, parameters, { component: clazz, name: name, children: children });
    };

    var Form = function (_Component) {
        _inherits(Form, _Component);

        function Form() {
            _classCallCheck(this, Form);

            return _possibleConstructorReturn(this, (Form.__proto__ || Object.getPrototypeOf(Form)).apply(this, arguments));
        }

        _createClass(Form, null, [{
            key: 'field',
            value: function field(clazz) {
                for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                }

                var field = new (Function.prototype.bind.apply(Field, [null].concat([clazz], args)))();
                if (clazz.prototype instanceof Form) {
                    field.children = clazz.fields(field.children, field.config || {}) || [];
                    Array.isArray(field.children) || (field.children = [field.children]);
                    // Not quite sure about this.
                    if (field.layout) {
                        field.layout.forEach(function (layout, i) {
                            return field.children[i] && (field.children[i].layout = Array.isArray(layout) ? layout : [layout]);
                        });
                    }
                }
                return field;
            }
        }, {
            key: 'fields',
            value: function fields(children, field) {
                return children || [];
            }
        }]);

        return Form;
    }(Component);

    function createElement(type, attributes, children) {
        if ((typeof attributes === 'undefined' ? 'undefined' : _typeof(attributes)) !== 'object') {
            return { type: type, key: type, attributes: {}, children: [] };
        }
        if (attributes instanceof Node) {
            return { type: type, key: attributes.key, childNode: attributes, attributeMapper: children };
        } else {
            // attributes may have get, set, val, ref and key ... and bunch of stuff meant to put in dom
            return { type: type, ref: attributes.ref, key: attributes.key || type, attributes: attributes || {}, children: children || [] };
        }
    }

    var Node = function () {
        function Node(parent, field, unboundModel, runtime) {
            _classCallCheck(this, Node);

            _extends(this, {
                parent: parent,
                runtime: runtime,
                form: null,
                field: field,
                control: null,
                dependencies: [],
                notifications: [],
                children: new Map(),
                erroringChildren: new Set(),
                lastData: undefined,
                lastError: undefined,
                attributes: {},
                unboundModel: unboundModel,
                // rendering-related part
                elementInfo: null,
                $parentDom: null,
                $prevDom: null,
                $lastDom: null,
                $nextNode: null,
                $prevNode: null,
                $followingChildNode: null,
                shouldRender: false,
                lastRenderStructure: [],
                lastAttachedChildren: new Set()
            });
            var control = new field.component(this);
            this.key = field.name + '-' + unboundModel.data.key;
            this.form = control instanceof Form ? control : parent.form;
            this.control = control;
        }

        _createClass(Node, [{
            key: 'render',
            value: function render() {
                var _this3 = this;

                if (this.shouldRender && this.isAttached()) {
                    this.shouldRender = false;

                    var _attributes = this.attributes,
                        mapper = _attributes.attributeMapper,
                        rest = _objectWithoutProperties(_attributes, ['attributeMapper']);

                    var renderStructure = this.control.render(this.lastData, this.lastError, rest, this.children);
                    var attributes = this.field.layout || [],
                        layoutIndex = 0;
                    if (this.elementInfo.attributeMapper) {
                        var f = mapper;
                        mapper = function mapper(a) {
                            return _this3.elementInfo.attributeMapper(f ? f(a) : a);
                        };
                    }
                    // The problem here is we have layout attributes of container, but we can't pass its portion to children because there s no telling what s their size. 
                    // if we were to calculate current size, every time child moves or its dimensions change it would need to notify all siblings to update their parent node attributes
                    renderStructure = (Array.isArray(renderStructure) ? renderStructure : [renderStructure]).map(function (st) {
                        return st instanceof Node ? st : {
                            key: st && st.type || '0',
                            attributes: (mapper ? mapper(attributes[layoutIndex++] || {}) : attributes[layoutIndex++]) || {},
                            dom: null,
                            content: st
                        };
                    });
                    var lrs = 0,
                        tail = this.$prevDom,
                        prevNode = null,
                        followingChildNode = null,
                        keyMap = DOM.makeKeyMap(renderStructure, this.lastRenderStructure);
                    var attachedChildren = new Set();
                    this.lastRenderStructure.forEach(function (lst) {
                        return lst.used = false;
                    });
                    for (var rs = 0; rs < renderStructure.length; rs++) {
                        var st = renderStructure[rs];
                        var lst = keyMap ? keyMap[rs] : this.lastRenderStructure[lrs];
                        var use = st === lst || lst && !(st instanceof Node || lst instanceof Node);
                        if (use) {
                            lst.used = true;
                            lrs++;
                        }
                        if (st instanceof Node) {
                            followingChildNode || (followingChildNode = st);
                            tail = st.setDom(this.elementInfo, this.$parentDom, tail);
                            attachedChildren.add(st);
                            prevNode && (prevNode.$nextNode = st), st.$prevNode = prevNode, prevNode = st;
                        } else {
                            st.dom = tail = use ? lst.dom : this.$parentDom.insertBefore(document.createElement(this.elementInfo.type), tail ? tail.nextSibling : this.$parentDom.firstChild);
                            st.content = this.applyInPlace(st.dom, st.content, use ? lst.content : [], attachedChildren);
                            DOM.reconcileAttributes(this.elementInfo.type, st.dom, st.attributes, use ? lst.attributes : {});
                            use || st.attributes.ref && st.attributes.ref(st.dom);
                        }
                    }
                    prevNode && (prevNode.$nextNode = null);
                    tail === this.$lastDom || this.adjustLastDom(tail);
                    this.lastRenderStructure.forEach(function (lst) {
                        return lst.used || lst instanceof Node || _this3.$parentDom.removeChild(lst.dom);
                    });
                    this.lastAttachedChildren.forEach(function (child) {
                        return attachedChildren.has(child) || child.setDom(null, null, null);
                    });
                    this.lastAttachedChildren = attachedChildren;
                    /*this.lastRenderStructure.forEach( lst => {
                        if( lst instanceof Node ) {
                            lst.used || attachedChildren.has(lst) || lst.setDom(null, null, null);
                            delete lst.used;
                        } else {
                            lst.used || this.$parentDom.removeChild(lst.dom);
                        }
                    });*/
                    this.$followingChildNode = followingChildNode;
                    this.lastRenderStructure = renderStructure;
                }
            }
        }, {
            key: 'adjustLastDom',
            value: function adjustLastDom(tail) {
                if (tail !== this.$lastDom) {
                    if (this.parent && this.parent.$lastDom === this.$lastDom) {
                        this.parent.adjustLastDom(tail);
                    }
                    if (this.$nextNode && this.$nextNode.$prevDom === this.$lastDom) {
                        this.$nextNode.adjustPrevDom(tail);
                    }
                    this.$lastDom = tail;
                }
            }
        }, {
            key: 'adjustPrevDom',
            value: function adjustPrevDom(head) {
                if (head !== this.$prevDom) {
                    if (this.$followingChildNode && this.$followingChildNode.$prevDom === this.$prevDom) {
                        this.$followingChildNode.adjustPrevDom(head);
                    }
                    if (this.$lastDom === this.$prevDom) {
                        this.adjustLastDom(head);
                    }
                    this.$prevDom = head;
                }
            }
        }, {
            key: 'applyInPlace',
            value: function applyInPlace(domElement, renderStructure, lastRenderStructure, attachedChildren) {
                renderStructure = (Array.isArray(renderStructure) ? renderStructure : [renderStructure]).map(function (st) {
                    return typeof st === 'string' ? { type: '#text', attributes: { text: st }, children: [] } : st;
                }).filter(function (st) {
                    return st && st.type;
                });

                var prev = null,
                    prevNode = null,
                    keyMap = DOM.makeKeyMap(renderStructure, lastRenderStructure);
                lastRenderStructure.forEach(function (lst) {
                    return lst.used = false;
                });
                for (var lrs = 0, rs = 0; rs < renderStructure.length; rs++) {
                    var st = renderStructure[rs];
                    if (st instanceof Node) {
                        throw "Component can't be mounted in a fixed-width node";
                    }
                    if (typeof st === 'string') {
                        renderStructure[rs] = st = { type: '#text', attributes: { text: st.toString() }, children: [] };
                    }

                    var lst = keyMap ? keyMap[rs] : lastRenderStructure[lrs],
                        child = st.childNode;
                    var use = lst && !lst.used && st.type === lst.type && child === lst.childNode; // this should never happen && !attachedChildren.has(child);
                    if (use) {
                        lst.used = true;
                        lrs++;
                    }
                    if (child !== undefined) {
                        prev = child.setDom(st, domElement, prev);
                        attachedChildren.add(child);
                        prevNode && (prevNode.$nextNode = child), child.$prevNode = prevNode, prevNode = child;
                    } else {
                        st.dom = use ? lst.dom : st.type === '#text' ? document.createTextNode('') : document.createElement(st.type);
                        prev = prev ? prev.nextSibling : domElement.firstChild;
                        if (prev !== st.dom) {
                            prev = domElement.insertBefore(st.dom, prev);
                        }
                        st.children = this.applyInPlace(st.dom, st.children, use ? lst.children : [], attachedChildren);
                        DOM.reconcileAttributes(st.type, st.dom, st.attributes, use ? lst.attributes : {});
                        use || st.attributes.ref && st.attributes.ref(st.dom);
                    }
                }
                prevNode && (prevNode.$nextNode = null);
                lastRenderStructure.forEach(function (lst) {
                    return lst.used || lst.childNode || lst.dom.parentElement.removeChild(lst.dom);
                });
                //lst.used || ( lst.childNode ? attachedChildren.has(lst.childNode) || lst.childNode.setDom(null, null, null) : lst.dom.parentElement.removeChild(lst.dom) )
                return renderStructure;
            }
        }, {
            key: 'setDom',
            value: function setDom(elementInfo, parentDom, prevDom) {
                var _this4 = this;

                var updateAttributes = false,
                    prev = prevDom,
                    layoutIndex = 0;
                if (parentDom) {
                    updateAttributes = !this.shouldRender;
                    if (this.elementInfo && elementInfo.type !== this.elementInfo.type) {
                        throw 'Unsupported';
                    }
                } else {
                    this.$nextNode = this.$prevNode = null;
                }
                this.lastRenderStructure.forEach(function (lst) {
                    if (lst instanceof Node) {
                        prev = lst.setDom(elementInfo, parentDom, prev);
                    } else {
                        if (parentDom) {
                            prev = prev ? prev.nextSibling : _this4.$parentDom === parentDom ? lst.dom : null;
                            if (lst.dom !== prev) {
                                prev = parentDom.insertBefore(lst.dom, prev);
                            }
                            if (updateAttributes) {
                                var attributes = _this4.field.layout && _this4.field.layout[layoutIndex++] || {};
                                if (typeof elementInfo.attributeMapper === 'function') {
                                    attributes = elementInfo.attributeMapper(attributes);
                                }
                                DOM.reconcileAttributes(elementInfo.type, lst.dom, attributes, lst.attributes);
                                lst.attributes = attributes;
                            }
                        } else {
                            _this4.$parentDom && _this4.$parentDom.removeChild(lst.dom);
                        }
                    }
                });
                this.elementInfo = elementInfo;
                this.$prevDom = prevDom;
                this.$lastDom = prev;
                this.$parentDom = parentDom;
                return prev;
            }
        }, {
            key: 'isAttached',
            value: function isAttached() {
                var node = this;
                for (; node && node.$parentDom; node = node.parent) {}
                return !node;
            }
        }, {
            key: 'notify',
            value: function notify(action) {
                this.notifications.push(action);
                this.runtime.shouldAnythingRender = true;
            }
        }, {
            key: 'store',
            value: function store(value, method) {
                var setter = this.attributes.set || this.field.set;
                typeof setter === 'function' && setter.call(this.form, this.unboundModel, value, method);
            }
        }, {
            key: 'acceptLogic',
            value: function acceptLogic(data, error) {
                var childrenFields = this.field.children;
                if (typeof data !== 'undefined' && !this.evicted) {
                    if (childrenFields.length) {
                        data = (Array.isArray(data) ? data : (typeof data === 'undefined' ? 'undefined' : _typeof(data)) == 'object' ? [data] : []).map(function (d) {
                            return typeof d.withListener == 'function' ? d : new JsonProxy(d);
                        });
                        this.runtime.reconcileChildren(this, data);
                    }
                    this.lastData = data;
                    this.lastError = error;
                    this.shouldRender = true;
                    this.runtime.shouldAnythingRender = true;
                    this.control.onUpdate(data, error, this.attributes);
                }
            }
        }]);

        return Node;
    }();

    var Runtime = function () {
        function Runtime(listener) {
            _classCallCheck(this, Runtime);

            this.schedule = [];
            this.listener = (listener || new DfeListener()).For();
            this.nodes = [];
            this.shouldAnythingRender = false;
            this.pendingLogic = new Set();
        }

        _createClass(Runtime, [{
            key: 'setDfeForm',
            value: function setDfeForm(formClass) {
                this.formClass = formClass;
                return this;
            }
        }, {
            key: 'setModel',
            value: function setModel(model) {
                this.rootProxy = (model instanceof JsonProxy ? model : new JsonProxy(model)).withListener(this.listener);
                return this;
            }
        }, {
            key: 'stop',
            value: function stop() {
                this.processor && clearInterval(this.processor);
            }
        }, {
            key: 'shutdown',
            value: function shutdown() {
                this.processor && clearInterval(this.processor);
                if (this.nodes.length) {
                    var root = this.nodes[0];
                    root.isAttached() && root.setDom(null, null, null);
                    this.evict(root);
                    this.removeEvicted();
                }
                this.processor = null;
            }
        }, {
            key: 'restart',
            value: function restart(parentElement, initAction) {
                var _this5 = this;

                parentElement || this.nodes.length && (parentElement = this.nodes[0].$parentDom);
                this.shutdown();
                this.initAction = { action: initAction || 'init' };
                if (this.rootProxy && this.formClass) {
                    parentElement && (parentElement._dfe_runtime = this);
                    var node = this.addNode(null, this.rootProxy, new Field(this.formClass, this.formClass.fields([], null)));
                    node.setDom({ type: 'div', childNode: node }, parentElement, null);
                    this.processor = setInterval(function () {
                        return _this5.processInterceptors();
                    }, 50);
                    this.processInterceptors();
                }
                return this;
            }
        }, {
            key: 'enforceValidation',
            value: function enforceValidation() {
                this.nodes.forEach(function (node) {
                    return node.notifications.push({ action: 'validate' });
                });
                this.shouldAnythingRender = true;
            }
        }, {
            key: 'setRoot',
            value: function setRoot(parentElement, afterNode) {
                var node = this.nodes[0];
                node && node.setDom(node.elementInfo, parentElement, afterNode || null);
            }
        }, {
            key: 'processInterceptors',
            value: function processInterceptors() {
                if (this.shouldAnythingRender) {
                    this.shouldAnythingRender = false;
                    for (var i = 0; i < this.nodes.length; i++) {
                        this.logic(this.nodes[i]);
                    }
                    this.removeEvicted();
                    DOM.batchRender(this.nodes);
                }
                while (this.schedule.length) {
                    this.schedule.shift()(this);
                }
            }
        }, {
            key: 'addNode',
            value: function addNode(parent, modelProxy, field) {
                var unbound = wrapProxy(modelProxy, function (path) {
                    return unbound.get(path);
                }, this.listener);
                var node = new Node(parent, field, unbound, this);
                node.notify(this.initAction);
                this.nodes.push(node);
                this.prep$$(node, unbound);
                return node;
            }
        }, {
            key: 'prep$$',
            value: function prep$$(node, unbound) {
                var runtime = this;
                var listener = this.listener.For(node);
                var model = wrapProxy(unbound, function (path) {
                    return model.get(path);
                }, listener);
                var field = node.field;
                node.model = model;
                model.unbound = unbound;
                unbound.$node = model.$node = node;
                model.result = function (data) {
                    node.acceptLogic(data, node.lastError);
                };
                model.error = function (error, data) {
                    if (typeof data !== 'undefined') {
                        node.lastData = data;
                    }
                    if (node.doValidation) {
                        if (error) {
                            node.stickyError = error;
                            runtime.notifyErroring(node);
                            node.acceptLogic(node.lastData, error);
                        }
                    }
                    return error;
                };
                model.errorwatch = function (target, reducer) {
                    var error = '';
                    if (target === 'peers') {
                        listener.get(node.parent, 'erroringChildren').forEach(function (node) {
                            return model.hasChild(node.model) && (error = reducer ? reducer(error, node.lastError) : node.lastError);
                        });
                    } else {
                        listener.get(target instanceof Node ? target : node, 'erroringChildren').forEach(function (node) {
                            return error = reducer ? reducer(error, node.lastError) : node.lastError;
                        });
                    }
                    error && node.acceptLogic(node.lastData, error);
                };
                model.required = function (name, pattern, message) {
                    var val = model.get(name);
                    Array.isArray(val) && (val = val[0]);
                    if (typeof val === 'undefined' || val.toString().replace(/ /g, '') === '') model.error(message || 'Required');else if (pattern === 'date' && !val.toString().match(arfDatePattern) || pattern && pattern !== 'date' && !val.match(pattern)) model.error(message || 'Invalid format');else return true;
                };
            }
        }, {
            key: 'removeErroring',
            value: function removeErroring(node) {
                if (node.lastError) {
                    delete node.lastError;
                    for (var cur = node.parent; cur && cur.erroringChildren.delete(node); cur = cur.parent) {
                        this.listener.notify(cur, 'erroringChildren');
                    }
                }
            }
        }, {
            key: 'notifyErroring',
            value: function notifyErroring(node) {
                for (var cur = node.parent; cur && !cur.erroringChildren.has(node); cur = cur.parent) {
                    cur.erroringChildren.add(node), this.listener.notify(cur, 'erroringChildren', 'validate');
                }
            }
        }, {
            key: 'evict',
            value: function evict(node) {
                var _this6 = this;

                node.evicted = true;
                node.notifications = [];
                node.children.forEach(function (fieldMap) {
                    return fieldMap.forEach(function (node) {
                        return _this6.evict(node);
                    });
                });
            }
        }, {
            key: 'removeEvicted',
            value: function removeEvicted() {
                var _this7 = this;

                var cur = 0;
                this.nodes.forEach(function (node, index) {
                    if (node.evicted) {
                        _this7.removeErroring(node);
                        var dpMap = _this7.listener.dpMap;
                        node.dependencies.forEach(function (dep) {
                            var eleMap = dpMap.get(dep.data);
                            if (eleMap) {
                                var ctlSet = eleMap.get(dep.element);
                                if (ctlSet) {
                                    ctlSet['delete'](node);
                                    ctlSet.size || eleMap['delete'](dep.element);
                                    eleMap.size || dpMap['delete'](dep.data);
                                }
                            }
                        });
                        node.control.destroy();
                    } else {
                        _this7.nodes[cur++] = _this7.nodes[index];
                    }
                });
                this.nodes.splice(cur);
            }
        }, {
            key: 'reconcileChildren',
            value: function reconcileChildren(parent, rowProxies) {
                var _this8 = this;

                // TODO... 
                var childFields = parent.field.children;
                var ownModel = parent.model.unbound;
                var lastChildren = parent.children;
                if (lastChildren.size || childFields.length) {
                    var rows = new Map(),
                        rkeys = new Set(),
                        fkeys = new Set(),
                        skeys = new Set(),
                        i = 0,
                        m,
                        present,
                        a,
                        f,
                        n,
                        c,
                        d;
                    lastChildren.forEach(function (v, k) {
                        return k ? (rkeys.add(k), i++ || v.forEach(function (_, f) {
                            return fkeys.add(f);
                        })) : v.forEach(function (_, f) {
                            return skeys.add(f);
                        });
                    });
                    (childFields || []).forEach(function (d) {
                        (typeof d['class'] == 'string' && d['class'] != '' ? skeys : fkeys).add(d);
                    });
                    (rowProxies || []).forEach(function (r) {
                        rows.set(r.data, r);rkeys.add(r.data);
                    });
                    rkeys.forEach(function (r) {
                        (m = lastChildren.get(r)) || lastChildren.set(r, m = new Map());
                        present = rows.get(r);
                        fkeys.forEach(function (k) {
                            c = m.get(k);
                            present ? c || m.set(k, this.addNode(parent, present, k)) : c && (this.evict(c), m['delete'](k));
                        }, _this8);
                        m.size || lastChildren['delete'](r);
                    });
                    m = lastChildren.get(null) || new Map();
                    skeys.forEach(function (k) {
                        c = m.get(k);
                        c || m.set(k, _this8.addNode(parent, ownModel, k));
                    });
                    m.size ? lastChildren.set(null, m) : lastChildren['delete'](null);
                }
            }
        }, {
            key: 'logic',
            value: function logic(node) {
                if (node.notifications.length && !node.evicted) {
                    var events = node.notifications;
                    node.notifications = [];
                    try {
                        var m = node.model,
                            d = node.field,
                            v,
                            fg,
                            fv;
                        //m.events = events;
                        var attrs = node.attributes = typeof d.atr === 'function' && d.atr.call(node.form, m) || {};
                        node.doValidation = node.lastError || attrs.errorwatch || node.control.doValidation(events, attrs);
                        this.removeErroring(node);
                        typeof (v = typeof (fg = d.get || attrs.get) != 'function' ? [m] : fg.call(node.form, m, events)) == 'undefined' || m.result(v);
                        if (attrs.errorwatch) {
                            var _attrs$errorwatch = attrs.errorwatch,
                                _target = _attrs$errorwatch.target,
                                reducer = _attrs$errorwatch.accept;

                            m.errorwatch(_target, reducer);
                        } else {
                            node.doValidation && typeof (fv = d.val || attrs.val) == 'function' && fv.call(node.form, m, events);
                        }
                    } catch (e) {
                        node.doValidation = 1;try {
                            node.model.error(e.message);
                        } catch (e) {}console.error(node.field + '\n' + e.message + '\n' + e.stack);
                    }
                }
            }
        }, {
            key: 'notifyNodes',
            value: function notifyNodes(nodes, action) {
                (typeof nodes.forEach === 'function' ? nodes : [nodes]).forEach(function (node) {
                    return node.notify({ action: action || 'n' });
                });
            }
        }, {
            key: 'findChildren',
            value: function findChildren(nodes, deep, includeSelf, field, model) {
                // TODO...
                var ret = new Set(),
                    a = [];
                function traverse(control) {
                    control.children.forEach(function (v) {
                        v.forEach(function (c) {
                            (!field || c.field.name == field) && (!model || c.model.data == model.data) && ret.add(c);
                            traverse(c);
                        });
                    });
                    control.fixedChildren.forEach(function (c) {
                        (!field || c.field.name == field) && (!model || c.model.data == model.data) && ret.add(c);
                        traverse(c);
                    });
                }
                (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (c) {
                    includeSelf && (!field || c.field.name == field) && (!model || c.model.data == model.data) && ret.add(c);
                    traverse(c);
                });
                ret.forEach(function (k) {
                    a.push(k);
                });
                return a;
            }
        }, {
            key: 'findNodes',
            value: function findNodes(fields, modelProxy) {
                // TODO...
                var ret = [],
                    array = Array.isArray(fields) ? fields : [fields];
                this.nodes.forEach(function (c) {
                    array.indexOf(c.field.name) != -1 && (!modelProxy || c.model.data == modelProxy.data) && ret.push(c);
                });
                return ret;
            }
        }], [{
            key: 'startRuntime',
            value: function startRuntime(arg) {
                var m = arg.model,
                    j = m instanceof JsonProxy || typeof m.shadow == 'function',
                    listener = j && m.listener || arg.listener || new DfeListener(),
                    runtime = new Runtime(listener);
                for (var v in arg.params) {
                    runtime[v] = arg.params[v];
                }j ? runtime.rootProxy = m.withListener(runtime.listener.For()) : runtime.setModel(m);
                runtime.setDfeForm(arg.form).restart(arg.node, arg.initAction);
                arg.ready && arg.ready(runtime, dfe, arg.model);
                return runtime;
            }
        }]);

        return Runtime;
    }();

    return {
        JsonProxy: JsonProxy,
        Form: Form,
        Runtime: Runtime,
        startRuntime: Runtime.startRuntime,
        createElement: createElement,
        nodeFromElement: DOM.nodeFromElement,
        Component: Component
    };
});

/*

define('validation/validator', ['dfe-core', 'validation/component'], function(core, component) {
	function listener(c) {
		return {
	        depend : function () {},
	        notify : function (d, e, a, v) { 
	            if('mard'.indexOf(a) != -1) {
	                console.error('Model is mutating (' + c && c.field.data.name + '):\n' + JSON.stringify(d) + '\n' + e + '\n' + a + '\n' + v );
	                throw new Error('Model is mutating');
	            }
	            return true; 
	        },
	        get : function(data, elem) { return data[elem] },
	        // TODO: this is used to set attribute of subform and it kind of "mutates". Do something about whole thing
	        set : function (data, element, value, action) { if(data[element] != value) { data[element] = value; this.notify(data, element, action, value) }; return true; },
	        For: function(o) { return listener(o); }
		}
	}
    return {
        validate: function(model, form) { //model, form
            console.time('Nashorn validation took');
            var rt = new core.Runtime(null, listener()).setDfeForm(form).setModel(model).restart('validate', true), errors = [];
            rt.rootnodes.forEach(function(r) {r.erroringChildren.forEach(function(c) {errors.push(c)})});
            rt.stop(); //shutdown(); //GC will do it for us?  - but stopping is necessary on client side since they have processInterceptors loop going
            var e = errors.map(function(c) { return {field: c.field.data.name, error: c.error}});
            console.timeEnd('Nashorn validation took');
            return { result : e.length == 0, data : e};
        }
    }
});*/

/* dynamic version - for editor ?
reconcileChildren(parent, rowProxies) {
    // TODO... 
    let childFields = parent.field.children;
    let ownModel = parent.model.unbound;
    let lastChildren = parent.children;
    if( lastChildren.size || childFields.length ) {
        var fields = new Map(), rows = new Map(), rkeys = new Set(), fkeys = new Set(), skeys = new Set(), i=0, m, present, a, f, n, c, d; 
        lastChildren.forEach((v, k) => k ? (rkeys.add(k), i++||v.forEach((_, f) => fkeys.add(f))) : v.forEach((_, f) => skeys.add(f)) );
        (childFields||[]).forEach(fp => { d=fp,fields.set(d, fp); (typeof d['class'] == 'string' && d['class']!=''?skeys:fkeys).add(d) });
        (rowProxies||[]).forEach(r => { rows.set(r.data, r); rkeys.add(r.data)});
        rkeys.forEach( r => { 
            (m = lastChildren.get(r))||lastChildren.set(r, m = new Map()); 
            present = rows.get(r); 
            fkeys.forEach(function(k) {
                c = m.get(k);
                present && (f=fields.get(k)) ? c || m.set(k, this.addNode(parent, present, f)) : c && (this.evict(c), m['delete'](k));
            }, this);
            m.size || lastChildren['delete'](r);
        });
        m = lastChildren.get(null)||new Map();
        skeys.forEach(k => {
            c = m.get(k);
            (f=fields.get(k)) ? c || m.set(k, this.addNode(parent, ownModel, f)) : c && (this.evict(c), m['delete'](k));
        });
        m.size ? lastChildren.set(null, m) : lastChildren['delete'](null);
    }
}        
*/

/*  TODO: idk about this. it s tempting to run delayed response based on promises but then we'll lose $$.required and $$.error features. probably

        acceptLogic(data, error) {
            error = error === undefined || error === null ? '' : error.toString();
            if( typeof data !== 'undefined' && !this.evicted && (data !== this.lastData || error !== this.lastError) ) {
                this.lastData = data;
                if( this.field.children.length ) {
                    data = (Array.isArray(data) ? data: typeof data == 'object' ? [data] : []).map(d => typeof d.withListener == 'function' ? d : new JsonProxy(d));
                    this.runtime.reconcileChildren(this, data);
                }
                this.lastError = error;                
                this.shouldRecalculateRenderStructure = true;
            }
        }
        static acceptError(node, payload) {
            if(Array.isArray(payload)) {
                let {data, error} = payload.reduce( (out, cur) => typeof cur === 'object' ? { data: cur.data || out.data, error: cur.error || out.error } : { data: out.data, error: cur && cur.toString() || out.error }, {} )
                node.acceptLogic( data || node.lastData, error );
            } else {
                typeof payload === 'object' ? node.acceptLogic(payload.data, payload.error) : node.acceptLogic(node.lastData, payload);
            }
        }
		
		logic(node) {
            if(node.notifications.length && !node.evicted) {
                var events = node.notifications;
                node.notifications = [];
                try {
                    let attributes = node.attributes = typeof node.field.atr === 'function' && node.field.atr.call(node.form, node.model) || {}
                    let getter = node.field.get || attributes.get;
                    let validate = node.field.val || attributes.val;
                    let doValidation = typeof validate === 'function' && node.control.doValidation(events, attributes);
                    let result = typeof getter === 'function' ? getter.call(node.form, node.model, events) : [node.model];
                    let error;
                    if(attributes.errorwatch) {
                        let { target: target, accept: reducer } = attributes.errorwatch;
                        error = node.model.errorwatch(target, reducer);
                    } else {
                        error = doValidation && typeof validate === 'function' && validate.call(node.form, node.model, events) || '';
                    }
                    if( result instanceof Promise ) {
                        this.pendingLogic.add(result);
                        result.then( data => node.acceptLogic(data, node.lastError), node.acceptError ).then(() => this.pendingLogic.delete(result));
                    } else {
                        node.acceptLogic(result, node.lastError);
                    }
                    if( error instanceof Promise ) {
                        this.pendingLogic.add(error);
                        error.then(node.acceptError, node.acceptError).then(() => this.pendingLogic.delete(error));
                    } else {
                        node.acceptError(error);
                    }
                } catch(e) { 
                    node.acceptError(e.message);
                    console.error('Unhandled error', node.field, e.message, e.stack); 
                }
            }
        }

*/

define('components/base', ['dfe-core'], function (Core) {
    return function (_Core$Component) {
        _inherits(BaseComponent, _Core$Component);

        function BaseComponent() {
            _classCallCheck(this, BaseComponent);

            return _possibleConstructorReturn(this, (BaseComponent.__proto__ || Object.getPrototypeOf(BaseComponent)).apply(this, arguments));
        }

        _createClass(BaseComponent, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                return data.toString();
            }
        }]);

        return BaseComponent;
    }(Core.Component);
});

define('components/container', ['dfe-core'], function (Core) {
    return function (_Core$Component2) {
        _inherits(Container, _Core$Component2);

        function Container() {
            _classCallCheck(this, Container);

            return _possibleConstructorReturn(this, (Container.__proto__ || Object.getPrototypeOf(Container)).apply(this, arguments));
        }

        return Container;
    }(Core.Component);
});

define('components/either', ['dfe-core'], function (Core) {
    return function (_Core$Component3) {
        _inherits(Either, _Core$Component3);

        function Either() {
            _classCallCheck(this, Either);

            return _possibleConstructorReturn(this, (Either.__proto__ || Object.getPrototypeOf(Either)).apply(this, arguments));
        }

        _createClass(Either, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var first = void 0,
                    rest = [];
                children.forEach(function (map) {
                    return map.forEach(function (child) {
                        return first ? attributes.first || rest.push(child) : first = child;
                    });
                });
                return attributes.first ? first : rest;
            }
        }]);

        return Either;
    }(Core.Component);
});

define('components/text', ['components/base'], function (BaseComponent) {
    return function (_BaseComponent) {
        _inherits(Text, _BaseComponent);

        function Text() {
            _classCallCheck(this, Text);

            return _possibleConstructorReturn(this, (Text.__proto__ || Object.getPrototypeOf(Text)).apply(this, arguments));
        }

        return Text;
    }(BaseComponent);
});

define('components/span', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent2) {
        _inherits(Span, _BaseComponent2);

        function Span() {
            _classCallCheck(this, Span);

            return _possibleConstructorReturn(this, (Span.__proto__ || Object.getPrototypeOf(Span)).apply(this, arguments));
        }

        _createClass(Span, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var sub = [],
                    wrap = attributes.wrap,
                    rest = _objectWithoutProperties(attributes, ['wrap']),
                    header = children.get(null);
                header && header.forEach(function (child) {
                    return sub.push(Core.createElement('span', child));
                });
                children.forEach(function (map, row) {
                    return row && map.forEach(function (child) {
                        return sub.push(Core.createElement('span', child));
                    });
                });
                return wrap === false ? [sub] : Core.createElement('span', attributes, sub);
            }
        }]);

        return Span;
    }(BaseComponent);
});

define('components/div', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent3) {
        _inherits(Div, _BaseComponent3);

        function Div() {
            _classCallCheck(this, Div);

            return _possibleConstructorReturn(this, (Div.__proto__ || Object.getPrototypeOf(Div)).apply(this, arguments));
        }

        _createClass(Div, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var sub = [],
                    wrap = attributes.wrap,
                    rest = _objectWithoutProperties(attributes, ['wrap']),
                    header = children.get(null);
                header && header.forEach(function (child) {
                    return sub.push(Core.createElement('div', child));
                });
                children.forEach(function (map, row) {
                    return row && map.forEach(function (child) {
                        return sub.push(Core.createElement('div', child));
                    });
                });
                return wrap === false ? [sub] : Core.createElement('div', rest, sub);
            }
        }]);

        return Div;
    }(BaseComponent);
});

define('components/inline-rows', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent4) {
        _inherits(InlineRows, _BaseComponent4);

        function InlineRows() {
            _classCallCheck(this, InlineRows);

            return _possibleConstructorReturn(this, (InlineRows.__proto__ || Object.getPrototypeOf(InlineRows)).apply(this, arguments));
        }

        _createClass(InlineRows, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var cellElement = attributes.element,
                    singleColumn = attributes.singleColumn;

                var rows = [],
                    current = void 0;
                if (['div', 'span', 'td'].indexOf(cellElement) === -1) {
                    cellElement = 'td';
                }
                children.forEach(function (map, row) {
                    return map.forEach(function (child) {
                        if (child.control instanceof InlineRows) {
                            rows.push(child);
                            current = undefined;
                        } else {
                            var ii = child.field.layout && child.field.layout[0];
                            if (current === undefined || !singleColumn || ii && ii.newRow) {
                                rows.push(current = []);
                            }
                            current.push(Core.createElement(cellElement, child));
                        }
                    });
                });
                return rows;
            }
        }]);

        return InlineRows;
    }(BaseComponent);
});

define('components/table', ['dfe-core', 'components/base', 'components/inline-rows'], function (Core, BaseComponent, InlineRows) {
    return function (_BaseComponent5) {
        _inherits(Table, _BaseComponent5);

        function Table(node) {
            _classCallCheck(this, Table);

            var _this16 = _possibleConstructorReturn(this, (Table.__proto__ || Object.getPrototypeOf(Table)).call(this, node));

            _this16.allColumns = node.field.children;
            _this16.form = node.form;
            return _this16;
        }

        _createClass(Table, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var headerClass = attributes.rowclass$header,
                    headerStyle = attributes.rowstyle$header,
                    footerClass = attributes.rowclass$footer,
                    footerStyle = attributes.rowstyle$footer,
                    rowClass = attributes.rowclass,
                    rowStyle = attributes.rowstyle,
                    singleColumn = attributes.singleColumn,
                    skip = attributes.skip,
                    colOrder = attributes.colOrder,
                    filter = attributes.filter,
                    order = attributes.order,
                    rest = _objectWithoutProperties(attributes, ['rowclass$header', 'rowstyle$header', 'rowclass$footer', 'rowstyle$footer', 'rowclass', 'rowstyle', 'singleColumn', 'skip', 'colOrder', 'filter', 'order']);

                data = this.orderFilterRows(data, filter, order).map(function (row) {
                    return row.data;
                });
                var columns = this.orderFilterFields(skip, colOrder);
                var head = this.makeRows(columns, [null], children, 'header', { style: headerStyle, class: headerClass }, 'tr', 'th', singleColumn);
                var foot = this.makeRows(columns, [null], children, 'footer', { style: footerStyle, class: footerClass }, 'tr', 'td', singleColumn);
                var body = this.makeRows(columns, data, children, '', { style: rowStyle, class: rowClass }, 'tr', 'td', singleColumn);
                return Core.createElement('table', rest, [head.length && Core.createElement('thead', {}, head), body.length && Core.createElement('tbody', {}, body), foot.length && Core.createElement('tfoot', {}, foot)]);
            }
        }, {
            key: 'makeRows',
            value: function makeRows(orderedFilteredColumns, orderedFilteredRows, children, clazz, rowAttributes, rowElement, cellElement, singleColumn) {
                var rows = [];
                orderedFilteredRows.forEach(function (row) {
                    var map = children.get(row),
                        current = void 0;
                    if (map) {
                        orderedFilteredColumns.forEach(function (field) {
                            if ((field.class || '') === clazz) {
                                var child = map.get(field);
                                if (child) {
                                    if (child.control instanceof InlineRows) {
                                        rows.push(Core.createElement(rowElement, child, function (layout) {
                                            return _extends({}, layout, rowAttributes);
                                        }));
                                        current = undefined;
                                    } else {
                                        var ii = child.field.layout && child.field.layout[0];
                                        if (current === undefined || singleColumn || ii && ii.newRow) {
                                            rows.push(current = Core.createElement(rowElement, _extends({ key: row ? row.key : 0 }, rowAttributes)));
                                        }
                                        current.children.push(Core.createElement(cellElement, child));
                                    }
                                }
                            }
                        });
                    }
                });
                return rows;
            }
        }, {
            key: 'orderFilterFields',
            value: function orderFilterFields(skip, colOrder) {
                var _this17 = this;

                var columns = skip ? this.allColumns.filter(function (columns) {
                    return typeof skip === 'function' ? !skip.call(_this17.form, columns.name) : skip.indexOf(columns.name) === -1;
                }) : this.allColumns;
                return typeof colOrder === 'function' ? columns.sort(function (c1, c2) {
                    return colOrder.call(_this17.form, c1.name, c2.name);
                }) : columns;
            }
        }, {
            key: 'orderFilterRows',
            value: function orderFilterRows(allRows, filter, order) {
                if (typeof filter == 'function') {
                    allRows = allRows.filter(filter);
                }
                return typeof order == 'function' ? allRows.sort(order) : allRows;
            }
        }]);

        return Table;
    }(BaseComponent);
});

define('components/div-r', ['dfe-core', 'components/table'], function (Core, Table) {
    return function (_Table) {
        _inherits(DivR, _Table);

        function DivR() {
            _classCallCheck(this, DivR);

            return _possibleConstructorReturn(this, (DivR.__proto__ || Object.getPrototypeOf(DivR)).apply(this, arguments));
        }

        _createClass(DivR, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var headerClass = attributes.rowclass$header,
                    headerStyle = attributes.rowstyle$header,
                    footerClass = attributes.rowclass$footer,
                    footerStyle = attributes.rowstyle$footer,
                    rowClass = attributes.rowclass,
                    rowStyle = attributes.rowstyle,
                    singleColumn = attributes.singleColumn,
                    skip = attributes.skip,
                    colOrder = attributes.colOrder,
                    filter = attributes.filter,
                    order = attributes.order,
                    rest = _objectWithoutProperties(attributes, ['rowclass$header', 'rowstyle$header', 'rowclass$footer', 'rowstyle$footer', 'rowclass', 'rowstyle', 'singleColumn', 'skip', 'colOrder', 'filter', 'order']);

                data = this.orderFilterRows(data, filter, order).map(function (row) {
                    return row.data;
                });
                var columns = this.orderFilterFields(skip, colOrder);
                return Core.createElement('div', rest, [].concat(_toConsumableArray(this.makeRows(columns, [null], children, 'header', { style: headerStyle, class: headerClass }, 'div', 'div', singleColumn)), _toConsumableArray(this.makeRows(columns, data, children, '', { style: rowStyle, class: rowClass }, 'div', 'div', singleColumn)), _toConsumableArray(this.makeRows(columns, [null], children, 'footer', { style: footerStyle, class: footerClass }, 'div', 'div', singleColumn))));
            }
        }]);

        return DivR;
    }(Table);
});

define('components/validation-component', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent6) {
        _inherits(ValidationComponent, _BaseComponent6);

        function ValidationComponent() {
            _classCallCheck(this, ValidationComponent);

            return _possibleConstructorReturn(this, (ValidationComponent.__proto__ || Object.getPrototypeOf(ValidationComponent)).apply(this, arguments));
        }

        _createClass(ValidationComponent, [{
            key: 'doValidation',
            value: function doValidation(events, attrs) {
                var vs = (attrs.vstrategy || '').split(' ');
                delete attrs.vstrategy;
                if (vs.indexOf('none') != -1 || vs.indexOf('disabled') == -1 && (attrs.disabled || attrs.hidden)) {
                    return false;
                }
                if (vs.indexOf('always') != -1 || vs.indexOf('followup') != -1 && this.$node.stickyError) {
                    return true;
                }
                if (vs.indexOf('notified') != -1 && events[0].action != 'init') {
                    return true;
                }
                return events.some(function (e) {
                    return 'validate' === e.action;
                });
            }
        }, {
            key: 'render',
            value: function render(data, error, attributes, children) {
                return !!error && !attributes.hideError && Core.createElement('label', { class: 'dfe-error', text: error.toString() });
            }
        }, {
            key: 'splitAttributes',
            value: function splitAttributes(attributes, error) {
                var ret = {},
                    hideError = attributes.hideError;
                if (!!error && !hideError && attributes.eclass) {
                    ret.class = (attributes.class ? attributes.class + ' ' : '') + attributes.eclass;
                    hideError = true;
                    delete attributes.class;
                }
                delete attributes.eclass;
                delete attributes.hideError;
                Object.getOwnPropertyNames(attributes).forEach(function (a) {
                    ret[a] = attributes[a];
                    delete attributes[a];
                });
                if (hideError) {
                    attributes.hideError = true;
                }
                return ret;
            }
        }]);

        return ValidationComponent;
    }(BaseComponent);
});

define('components/label', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    return function (_ValidationComponent) {
        _inherits(Label, _ValidationComponent);

        function Label() {
            _classCallCheck(this, Label);

            return _possibleConstructorReturn(this, (Label.__proto__ || Object.getPrototypeOf(Label)).apply(this, arguments));
        }

        _createClass(Label, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var html = attributes.html,
                    text = attributes.text,
                    label = attributes.label,
                    hideError = attributes.hideError,
                    rest = _objectWithoutProperties(attributes, ['html', 'text', 'label', 'hideError']);

                return [[html || label ? Core.createElement('label', _extends({ text: label, html: html }, rest)) : text || data.toString(), _get(Label.prototype.__proto__ || Object.getPrototypeOf(Label.prototype), 'render', this).call(this, null, error, { hideError: hideError }, children)]];
            }
        }]);

        return Label;
    }(ValidationComponent);
});

define('components/labeled-component', ['dfe-core', 'components/label'], function (Core, Label) {
    return function (_Label) {
        _inherits(Labeled, _Label);

        function Labeled() {
            _classCallCheck(this, Labeled);

            return _possibleConstructorReturn(this, (Labeled.__proto__ || Object.getPrototypeOf(Labeled)).apply(this, arguments));
        }

        _createClass(Labeled, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var firstChild = void 0;
                children.forEach(function (map) {
                    return map.forEach(function (child) {
                        return firstChild || (firstChild = child);
                    });
                });
                return [].concat(_toConsumableArray(_get(Labeled.prototype.__proto__ || Object.getPrototypeOf(Labeled.prototype), 'render', this).call(this, "not specified", error, attributes, children)), [firstChild]);
            }
        }]);

        return Labeled;
    }(Label);
});

define('components/editbox', ['dfe-core', 'components/validation-component', 'components/date-picker-polyfill'], function (Core, ValidationComponent) {
    function Patterning(v, p) {
        while (p && v != 0 && !(v.match(p) && v.match(p)[0] == v)) {
            v = v.substr(0, v.length - 1);
        }
        return v;
    }
    function Formatting(value, format) {
        // aka XXX-XXX-XXXX or MM/DD/YYYY
        if (format && typeof value !== 'undefined') {
            var ret = '',
                i = void 0,
                j = void 0,
                vn = void 0,
                vl = void 0,
                fn = void 0,
                fl = void 0;
            value = (Array.isArray(value) ? value[0] : value).toString().replace(/\W/g, '');
            for (i = 0, j = 0; i < format.length && j < value.length; i++) {
                vn = !(vl = value.charAt(j).match(/[A-Z]/i)) && !isNaN(parseInt(value.charAt(j)));
                fn = !(fl = format.charAt(i) == '_') && 'XdDmMyY9'.indexOf(format.charAt(i)) >= 0;
                if (fl && !vl || fn && !vn) break;
                ret += fl && vl || fn && vn ? value.charAt(j++) : format.charAt(i);
            }
            value = ret;
        }
        return value || '';
    }
    return function (_ValidationComponent2) {
        _inherits(Editbox, _ValidationComponent2);

        function Editbox(node) {
            _classCallCheck(this, Editbox);

            var _this22 = _possibleConstructorReturn(this, (Editbox.__proto__ || Object.getPrototypeOf(Editbox)).call(this, node));

            _this22.ca = 0;
            _this22.events = {
                onKeyDown: function onKeyDown(e) {
                    return _this22.onKeyDown(e);
                },
                onKeyUp: function onKeyUp(e) {
                    return _this22.onKeyUp(e);
                },
                onChange: function onChange(e) {
                    return _this22.onKeyUp(e, true);
                }
            };
            return _this22;
        }

        _createClass(Editbox, [{
            key: 'onKeyUp',
            value: function onKeyUp(e, doStore) {
                doStore = doStore || this.trigger !== 'store';
                var data = Patterning(Formatting(e.target.value, this.format), this.pattern);
                var transform = typeof this.transform === 'string' && this.transform.split('').map(function (s) {
                    return +s;
                });
                if (transform) {
                    var t = [];
                    for (var i = 0; i < transform.length; i++) {
                        data.length > transform[i] && (t[i] = data.charAt(transform[i]));
                    }for (var _i = 0; _i < t.length; _i++) {
                        t[_i] = t[_i] || ' ';
                    }data = t.join('');
                }
                this.getValueProcessed(data, e.target);
                doStore && this.store(data);
            }
        }, {
            key: 'onKeyDown',
            value: function onKeyDown(e) {
                var ui = e.target,
                    s = ui.selectionStart,
                    v = ui.value;
                if ((e.key == 'Backspace' || e.key == 'Delete' || e.key == 'Del') && this.format && v.length != ui.selectionEnd) {
                    e.preventDefault();
                    s && (ui.selectionEnd = --ui.selectionStart);
                }
                if (!e.key || e.key.length > 1 || e.ctrlKey) return;
                if (this.format) {
                    this.ca++;
                    if (e.key == this.format[s]) {
                        ui.selectionStart++;e.preventDefault();return;
                    }
                    while (this.format[s] && '_XdDmMyY9'.indexOf(this.format[s]) == -1) {
                        s++;
                    }var ol = v.length,
                        nl = Formatting(v.substr(0, s) + e.key + v.substr(s + 1), this.format).length;
                    if (s < ol && nl >= ol || s >= ol && nl > ol) {
                        ui.value = ui.value.substr(0, s) + ui.value.substr(s + 1);
                        ui.selectionEnd = s;
                    } else {
                        e.preventDefault();
                        return;
                    }
                }
                if (this.pattern) {
                    var m = void 0,
                        _v = void 0;
                    m = (_v = ui.value.substr(0, s) + e.key + ui.value.substr(ui.selectionEnd)).match(this.pattern);
                    (!m || m[0] != _v) && (this.ca--, e.preventDefault());
                }
            }
        }, {
            key: 'getValueProcessed',
            value: function getValueProcessed(data, ui) {
                var transform = typeof this.transform === 'string' && this.transform.split('').map(function (s) {
                    return +s;
                });
                if (transform) {
                    var t = [];
                    for (var i = 0; i < data.length; i++) {
                        transform.length > i && (t[transform[i]] = data.charAt(i));
                    }data = t.join('');
                }
                data = Patterning(Formatting(data, this.format), this.pattern);
                if (ui && data != ui.value) {
                    if (document.activeElement === ui) {
                        var v = ui.value,
                            ss = ui.selectionStart;
                        ui.value = data;
                        if (this.format && ss >= this.ca && ss <= v.length && v != ui.value) {
                            var over = this.format.substr(ss - this.ca, this.ca).replace(/[_XdDmMyY9]/g, '').length;
                            ui.selectionEnd = ui.selectionStart = ss + over;
                        }
                    } else {
                        ui.value = data;
                    }
                    this.ca = 0;
                }
                return data;
            }
        }, {
            key: 'render',
            value: function render(data, error, attributes, children) {
                var format = attributes.formatting,
                    pattern = attributes.pattern,
                    transform = attributes.transform,
                    trigger = attributes.trigger,
                    rest = _objectWithoutProperties(attributes, ['formatting', 'pattern', 'transform', 'trigger']);

                _extends(this, { format: format, pattern: pattern, transform: transform, trigger: trigger });
                return [[Core.createElement('input', _extends({}, this.splitAttributes(rest, error), this.events, { value: this.getValueProcessed(data.toString()) })), typeof eclass !== 'string' && _get(Editbox.prototype.__proto__ || Object.getPrototypeOf(Editbox.prototype), 'render', this).call(this, null, error, rest)]];
            }
        }]);

        return Editbox;
    }(ValidationComponent);
});

define('components/editbox-$', ['components/editbox'], function (Editbox) {
    function Formatting(v, n, l) {
        do {
            v = (n ? '' : '$') + v.replace(/[^\d]/g, '').replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        } while (l && v.length > l && (v = v.substr(0, v.length - 1)));
        return v;
    }

    return function (_Editbox) {
        _inherits(EditboxMoney, _Editbox);

        function EditboxMoney() {
            _classCallCheck(this, EditboxMoney);

            return _possibleConstructorReturn(this, (EditboxMoney.__proto__ || Object.getPrototypeOf(EditboxMoney)).apply(this, arguments));
        }

        _createClass(EditboxMoney, [{
            key: 'onKeyUp',
            value: function onKeyUp(e, store) {
                var ui = e.target,
                    data = this.getValueProcessed(ui.value, ui);
                store && this.store(data);
            }
        }, {
            key: 'onKeyDown',
            value: function onKeyDown(e) {
                var ui = e.target,
                    ml = (this.format && this.format.length) < Formatting(ui.value + '1', this.format && this.format.charAt(0) != '$', 99).length;
                if ((e.key == ',' || e.key == 'Delete' || e.key == 'Del') && ui.value.charAt(ui.selectionStart) == ',') ui.selectionStart++;
                if ((e.key == 'Delete' || e.key == 'Del') && ui.value.charAt(ui.selectionStart) == '$') ui.selectionStart++;
                !e.ctrlKey && e.key && e.key.length == 1 && ui.selectionStart == ui.selectionEnd && (e.key < '0' || e.key > '9' || ml) && e.preventDefault();
            }
        }, {
            key: 'getValueProcessed',
            value: function getValueProcessed(data, ui) {
                Array.isArray(data) && (data = data[0]);
                data = typeof data == 'string' || typeof data == 'number' ? Formatting(data, this.format && this.format.charAt(0) != '$', this.format && this.format.length) : '';
                if (data === '$') data = '';
                if (ui && data != ui.value) {
                    var ss = ui.selectionStart,
                        ov = ui.value,
                        o = 0;
                    ui.value = data;
                    if (document.activeElement == ui) {
                        for (var i = 0; i < ss; i++) {
                            (data.charAt(i) == ',' || data.charAt(i) == '$') && o++;
                            (ov.charAt(i) == ',' || ov.charAt(i) == '$') && o--;
                        }
                        ui.selectionStart = ui.selectionEnd = ss + o - (ov.charAt(ss) == ',' && data.charAt(ss + o - 1) == ',' ? 1 : 0);
                    }
                }
                return data;
            }
        }]);

        return EditboxMoney;
    }(Editbox);
});

define('components/button', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    return function (_ValidationComponent3) {
        _inherits(Button, _ValidationComponent3);

        function Button() {
            _classCallCheck(this, Button);

            return _possibleConstructorReturn(this, (Button.__proto__ || Object.getPrototypeOf(Button)).apply(this, arguments));
        }

        _createClass(Button, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this25 = this;

                var value = data.toString(),
                    rest = _objectWithoutProperties(attributes, []);
                return [[Core.createElement('input', _extends({}, this.splitAttributes(rest, error), { value: value, type: 'button', onClick: function onClick() {
                        return _this25.store(value, 'click');
                    } })), _get(Button.prototype.__proto__ || Object.getPrototypeOf(Button.prototype), 'render', this).call(this, null, error, rest)]];
            }
        }]);

        return Button;
    }(ValidationComponent);
});

define('components/checkbox', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    return function (_ValidationComponent4) {
        _inherits(Checkbox, _ValidationComponent4);

        function Checkbox() {
            _classCallCheck(this, Checkbox);

            return _possibleConstructorReturn(this, (Checkbox.__proto__ || Object.getPrototypeOf(Checkbox)).apply(this, arguments));
        }

        _createClass(Checkbox, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this27 = this;

                if (Array.isArray(data)) {
                    data = data[0];
                }

                var rest = _objectWithoutProperties(attributes, []);

                var checked = data && ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' ? data.checked && data.checked.toString().match(/Y|y/) : data.toString().match(/Y|y/));
                var text = (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && data.text;
                return [[Core.createElement('input', _extends({}, this.splitAttributes(rest, error), { checked: !!checked, type: 'checkbox', onChange: function onChange(e) {
                        return _this27.store(e.target.checked ? 'Y' : 'N');
                    } })), text, _get(Checkbox.prototype.__proto__ || Object.getPrototypeOf(Checkbox.prototype), 'render', this).call(this, null, error, rest)]];
            }
        }]);

        return Checkbox;
    }(ValidationComponent);
});

define('components/dropdown', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    function testChoice(a, b) {
        return a == b || (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' && (typeof b === 'undefined' ? 'undefined' : _typeof(b)) === 'object' && Object.getOwnPropertyNames(a).every(function (i) {
            return a[i] == b[i];
        });
    }
    return function (_ValidationComponent5) {
        _inherits(Dropdown, _ValidationComponent5);

        function Dropdown() {
            _classCallCheck(this, Dropdown);

            return _possibleConstructorReturn(this, (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).apply(this, arguments));
        }

        _createClass(Dropdown, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this29 = this;

                var def = attributes['default'],
                    rest = _objectWithoutProperties(attributes, ['default']);

                var options = def ? [{ text: 'Please select...', value: def }] : [];
                var selectedIndex = 0;
                if (Array.isArray(data.items)) {
                    options = options.concat(data.items.map(function (item) {
                        return (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object' ? { text: item.description || item.value.toString(), value: item.value } : { text: item.toString(), value: item };
                    }));
                }
                options.forEach(function (item, i) {
                    return testChoice(data.value, item.value) && (selectedIndex = i);
                });
                return [[Core.createElement('select', _extends({}, this.splitAttributes(rest, error), { selectedIndex: selectedIndex, onChange: function onChange(e) {
                        return _this29.store(options[e.target.selectedIndex].value);
                    } }), options.map(function (opt) {
                    return Core.createElement('option', { text: opt.text });
                })), _get(Dropdown.prototype.__proto__ || Object.getPrototypeOf(Dropdown.prototype), 'render', this).call(this, null, error, rest)]];
            }
        }]);

        return Dropdown;
    }(ValidationComponent);
});

define('components/html', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent7) {
        _inherits(Html, _BaseComponent7);

        function Html() {
            _classCallCheck(this, Html);

            return _possibleConstructorReturn(this, (Html.__proto__ || Object.getPrototypeOf(Html)).apply(this, arguments));
        }

        _createClass(Html, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                return Core.createElement('span', _extends({}, attributes, { html: data }));
            }
        }]);

        return Html;
    }(BaseComponent);
});

define('components/html-form', ['dfe-core', 'components/div'], function (Core, Div) {
    return function (_Div) {
        _inherits(HtmlForm, _Div);

        function HtmlForm() {
            _classCallCheck(this, HtmlForm);

            return _possibleConstructorReturn(this, (HtmlForm.__proto__ || Object.getPrototypeOf(HtmlForm)).apply(this, arguments));
        }

        _createClass(HtmlForm, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var name = attributes.name,
                    id = attributes.id,
                    action = attributes.action,
                    method = attributes.method,
                    target = attributes.target,
                    rest = _objectWithoutProperties(attributes, ['name', 'id', 'action', 'method', 'target']);

                return Core.createElement('form', { name: name, id: id, action: action, method: method, target: target }, [_get(HtmlForm.prototype.__proto__ || Object.getPrototypeOf(HtmlForm.prototype), 'render', this).call(this, data, error, rest, children)]);
            }
        }]);

        return HtmlForm;
    }(Div);
});

define('components/tab-s', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent8) {
        _inherits(TabS, _BaseComponent8);

        function TabS(node) {
            _classCallCheck(this, TabS);

            var _this32 = _possibleConstructorReturn(this, (TabS.__proto__ || Object.getPrototypeOf(TabS)).call(this, node));

            _this32.activeTab = -1;
            _this32.lastRows = new Set();
            return _this32;
        }

        _createClass(TabS, [{
            key: 'setActiveTab',
            value: function setActiveTab(key) {
                if (this.activeTab !== key) {
                    this.activeTab = key;
                    this.update();
                }
            }
        }, {
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this33 = this;

                var headerClass = attributes.rowclass$header,
                    headerStyle = attributes.rowstyle$header,
                    rowClass = attributes.rowclass,
                    rowStyle = attributes.rowstyle,
                    headField = attributes.headField,
                    focusnew = attributes.focusnew,
                    haclass = attributes.haclass,
                    rest = _objectWithoutProperties(attributes, ['rowclass$header', 'rowstyle$header', 'rowclass', 'rowstyle', 'headField', 'focusnew', 'haclass']),
                    nextRows = new Set();

                var head = Core.createElement('div', { class: headerClass, style: headerStyle });
                var body = Core.createElement('div', { class: rowClass, style: rowStyle });
                this.activeTab = data.some(function (proxy) {
                    return _this33.activeTab === proxy.data.key;
                }) ? this.activeTab : data[0] && data[0].data.key;
                data.forEach(function (proxy) {
                    var key = proxy.data.key;
                    nextRows.add(key);
                    _this33.lastRows.has(key) || _this33.lastRows.size && focusnew && (_this33.activeTab = key);
                });
                headField = headField || 'header';
                this.lastRows = nextRows;
                children.forEach(function (map, row) {
                    if (row) {
                        map.forEach(function (child, field) {
                            if (field.name === headField) {
                                head.children.push(Core.createElement('div', child, function (layout) {
                                    return _extends({}, layout, row.key === _this33.activeTab ? { class: (layout.class ? layout.class + ' ' : '') + haclass } : {}, {
                                        onClick: function onClick() {
                                            return _this33.setActiveTab(row.key);
                                        }
                                    });
                                }));
                            } else {
                                row.key === _this33.activeTab && body.children.push( Core.createElement('div', child) );
                                /*body.children.push(Core.createElement('div', child, function (layout) {
                                    return row.key === _this33.activeTab ? layout : _extends({}, layout, { style: 'display: none' });
                                }));*/
                            }
                        });
                    }
                });
                return Core.createElement('div', rest, [head, body]);
            }
        }]);

        return TabS;
    }(BaseComponent);
});

define('components/tab-d', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    var ActiveTabHandler = function () {
        function ActiveTabHandler() {
            _classCallCheck(this, ActiveTabHandler);
        }

        _createClass(ActiveTabHandler, [{
            key: 'prepare',
            value: function prepare(children) {
                throw new Error('Not implemented');
            }
        }, {
            key: 'activeTab',
            value: function activeTab(model) {
                throw new Error('Not implemented');
            }
        }, {
            key: 'store',
            value: function store(model) {}
        }]);

        return ActiveTabHandler;
    }();

    return function (_BaseComponent9) {
        _inherits(TabD, _BaseComponent9);

        function TabD(node) {
            _classCallCheck(this, TabD);

            var _this34 = _possibleConstructorReturn(this, (TabD.__proto__ || Object.getPrototypeOf(TabD)).call(this, node));

            _this34.handler = new ActiveTabHandler(_this34);
            _this34.allColumns = node.field.children;
            return _this34;
        }

        _createClass(TabD, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this35 = this;

                var headerClass = attributes.rowclass$header,
                    headerStyle = attributes.rowstyle$header,
                    rowClass = attributes.rowclass,
                    rowStyle = attributes.rowstyle,
                    haclass = attributes.haclass,
                    activeTab = attributes.activeTab,
                    rest = _objectWithoutProperties(attributes, ['rowclass$header', 'rowstyle$header', 'rowclass', 'rowstyle', 'haclass', 'activeTab']);

                var useHandler = typeof activeTab !== 'function';
                if (useHandler) {
                    this.handler.prepare(children);
                }

                var head = Core.createElement('div', { class: headerClass, style: headerStyle });
                var body = Core.createElement('div', { class: rowClass, style: rowStyle });
                var headField = this.allColumns.filter(function (field) {
                    return !field.class;
                }).pop();
                data.forEach(function (model) {
                    var child = children.get(model.data).get(headField),
                        isActive = (useHandler ? _this35.handler.activeTab : activeTab)(model);
                    if (child) {
                        head.children.push(Core.createElement('div', child, function (layout) {
                            return _extends({}, layout, isActive ? { class: (layout.class ? layout.class + ' ' : '') + haclass } : {}, {
                                onClick: function onClick() {
                                    return _this35.handler.store(model), _this35.store(model);
                                }
                            });
                        }));
                    }
                });
                children.get(null).forEach(function (child, field) {
                    return field.name === (useHandler ? _this35.handler.activeTab : activeTab)() && body.children.push(Core.createElement('div', child));
                });
                return Core.createElement('div', rest, [head, body]);
            }
        }]);

        return TabD;
    }(BaseComponent);
});

define('components/div-c', ['dfe-core', 'components/table'], function (Core, Table) {
    return function (_Table2) {
        _inherits(DivC, _Table2);

        function DivC() {
            _classCallCheck(this, DivC);

            return _possibleConstructorReturn(this, (DivC.__proto__ || Object.getPrototypeOf(DivC)).apply(this, arguments));
        }

        _createClass(DivC, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this37 = this;

                var rowClass = attributes.rowclass,
                    rowStyle = attributes.rowstyle,
                    skip = attributes.skip,
                    colOrder = attributes.colOrder,
                    filter = attributes.filter,
                    order = attributes.order,
                    rest = _objectWithoutProperties(attributes, ['rowclass', 'rowstyle', 'skip', 'colOrder', 'filter', 'order']);

                var fields = {
                    header: [],
                    footer: [],
                    "": []
                };
                var rows = this.orderFilterRows(data, filter, order);
                this.orderFilterFields(skip, colOrder).forEach(function (field) {
                    return fields[field.class || ''].push(field);
                });
                var columns = fields[""].map(function (field) {
                    return Core.createElement('div', { key: field.name, style: rowStyle, class: rowClass });
                });
                this.toColumns(children.get(null), fields.header, columns);
                rows.forEach(function (model) {
                    return _this37.toColumns(children.get(model.data), fields[""], columns);
                });
                this.toColumns(children.get(null), fields.footer, columns);
                return Core.createElement('div', rest, columns);
            }
        }, {
            key: 'toColumns',
            value: function toColumns(map, fields, out) {
                if (map) {
                    map.forEach(function (child, field) {
                        var column = out[fields.indexOf(field)];
                        if (column) {
                            column.children.push(Core.createElement('div', child));
                        }
                    });
                }
            }
        }]);

        return DivC;
    }(Table);
});

define('components/radiolist', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    function testChoice(a, b) {
        return a == b || (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' && (typeof b === 'undefined' ? 'undefined' : _typeof(b)) === 'object' && Object.getOwnPropertyNames(a).every(function (i) {
            return a[i] == b[i];
        });
    }
    var radioNameCounter = 0;
    return function (_ValidationComponent6) {
        _inherits(Radiolist, _ValidationComponent6);

        function Radiolist(node) {
            _classCallCheck(this, Radiolist);

            var _this38 = _possibleConstructorReturn(this, (Radiolist.__proto__ || Object.getPrototypeOf(Radiolist)).call(this, node));

            _this38.defaultName = 'Radiolist#' + ++radioNameCounter;
            return _this38;
        }

        _createClass(Radiolist, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this39 = this;

                var orientation = attributes.orientation,
                    rest = _objectWithoutProperties(attributes, ['orientation']);

                var normalized = (Array.isArray(data) ? data[0] : data) || 'N';
                if (typeof normalized === 'string') {
                    normalized = { value: data, items: [{ value: 'Y', description: 'Yes' }, { value: 'N', description: 'No' }] };
                }
                return [[].concat(_toConsumableArray(Array.prototype.concat.apply([], normalized.items.map(function (item) {
                    return [Core.createElement('input', _extends({
                        name: _this39.defaultName
                    }, _this39.splitAttributes(rest, error), {
                        type: 'radio',
                        checked: testChoice(normalized.value, item.value),
                        onChange: function onChange() {
                            return _this39.store(item.value);
                        }
                    })), item.description || item.value.toString(), orientation === 'vertical' && Core.createElement('br')];
                }))), [_get(Radiolist.prototype.__proto__ || Object.getPrototypeOf(Radiolist.prototype), 'render', this).call(this, null, error, rest)])];
            }
        }]);

        return Radiolist;
    }(ValidationComponent);
});

define('components/iframe', ['dfe-core', 'components/base'], function (Core, BaseComponent) {
    return function (_BaseComponent10) {
        _inherits(Iframe, _BaseComponent10);

        function Iframe() {
            _classCallCheck(this, Iframe);

            return _possibleConstructorReturn(this, (Iframe.__proto__ || Object.getPrototypeOf(Iframe)).apply(this, arguments));
        }

        _createClass(Iframe, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                return Core.createElement('iframe', _extends({ src: data.toString() }, attributes));
            }
        }]);

        return Iframe;
    }(BaseComponent);
});

define('components/textarea', ['dfe-core', 'components/editbox', 'components/validation-component'], function (Core, Editbox, ValidationComponent) {
    return function (_Editbox2) {
        _inherits(Textarea, _Editbox2);

        function Textarea() {
            _classCallCheck(this, Textarea);

            return _possibleConstructorReturn(this, (Textarea.__proto__ || Object.getPrototypeOf(Textarea)).apply(this, arguments));
        }

        _createClass(Textarea, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var format = attributes.formatting,
                    pattern = attributes.pattern,
                    transform = attributes.transform,
                    trigger = attributes.trigger,
                    rest = _objectWithoutProperties(attributes, ['formatting', 'pattern', 'transform', 'trigger']);

                _extends(this, { format: format, pattern: pattern, transform: transform, trigger: trigger });
                return [[Core.createElement('textarea', _extends({}, this.splitAttributes(rest, error), this.events, { value: this.getValueProcessed(data.toString()) })), ValidationComponent.prototype.render.call(this, null, error, rest)]];
            }
        }]);

        return Textarea;
    }(Editbox);
});

define('components/dfe-runtime', ['dfe-core'], function (Core) {
    return function (_Core$Component4) {
        _inherits(ChildRuntime, _Core$Component4);

        function ChildRuntime() {
            _classCallCheck(this, ChildRuntime);

            return _possibleConstructorReturn(this, (ChildRuntime.__proto__ || Object.getPrototypeOf(ChildRuntime)).apply(this, arguments));
        }

        _createClass(ChildRuntime, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this43 = this;

                var formName = attributes.form,
                    editTarget = attributes.editTarget,
                    rest = _objectWithoutProperties(attributes, ['form', 'editTarget']);

                var model = data[0] || {};
                ChildRuntime.setDOMAttributes(this.ref, formName, editTarget, model);
                return Core.createElement('div', _extends({}, rest, { ref: function ref(dom) {
                        return ChildRuntime.setDOMAttributes(_this43.ref = dom, formName, editTarget, model);
                    } }));
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                var rt = this.ref && this.ref._dfe_runtime;
                if (rt) {
                    rt.shutdown();
                }
                _get(ChildRuntime.prototype.__proto__ || Object.getPrototypeOf(ChildRuntime.prototype), 'destroy', this).call(this);
            }
        }], [{
            key: 'setDOMAttributes',
            value: function setDOMAttributes(ref, formName, editTarget, model) {
                if (ref) {
                    ref.setAttribute('dfe-form', formName);
                    ref.dfeModel = model;
                    editTarget ? ref.setAttribute('dfe-edit-target', '') : element.removeAttribute('dfe-edit-target');
                }
            }
        }]);

        return ChildRuntime;
    }(Core.Component);
});

define('components/div-button', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    return function (_ValidationComponent7) {
        _inherits(DivButton, _ValidationComponent7);

        function DivButton() {
            _classCallCheck(this, DivButton);

            return _possibleConstructorReturn(this, (DivButton.__proto__ || Object.getPrototypeOf(DivButton)).apply(this, arguments));
        }

        _createClass(DivButton, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this45 = this;

                var value = data.toString(),
                    rest = _objectWithoutProperties(attributes, []);
                return Core.createElement('div', _extends({}, this.splitAttributes(rest, error), { onClick: function onClick() {
                        return _this45.store(value, 'click');
                    } }), [Core.createElement('label', { class: 'div-button-text', html: value }), _get(DivButton.prototype.__proto__ || Object.getPrototypeOf(DivButton.prototype), 'render', this).call(this, null, error, rest)]);
            }
        }]);

        return DivButton;
    }(ValidationComponent);
});

define('components/multioption', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    return function (_ValidationComponent8) {
        _inherits(Multioption, _ValidationComponent8);

        function Multioption() {
            _classCallCheck(this, Multioption);

            return _possibleConstructorReturn(this, (Multioption.__proto__ || Object.getPrototypeOf(Multioption)).apply(this, arguments));
        }

        _createClass(Multioption, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var _this47 = this;

                var value = data.value.toString(),
                    rest = _objectWithoutProperties(attributes, []);
                return Core.createElement('div', _extends({}, this.splitAttributes(rest, error)), [].concat(_toConsumableArray(Array.prototype.concat.apply([], data.options.map(function (option) {
                    return [Core.createElement('input', {
                        type: 'checkbox',
                        checked: option === value,
                        onChange: function onChange(e) {
                            return _this47.store(e.target.checked ? option : []);
                        }
                    }), option];
                }))), [_get(Multioption.prototype.__proto__ || Object.getPrototypeOf(Multioption.prototype), 'render', this).call(this, null, error, rest)]));
            }
        }]);

        return Multioption;
    }(ValidationComponent);
});

define('components/labeled', ['dfe-core', 'components/validation-component'], function (Core, ValidationComponent) {
    return function (_ValidationComponent9) {
        _inherits(Labeled, _ValidationComponent9);

        function Labeled(node) {
            _classCallCheck(this, Labeled);

            var _this48 = _possibleConstructorReturn(this, (Labeled.__proto__ || Object.getPrototypeOf(Labeled)).call(this, node));

            _this48.renderComponent = _this48.getComponent().prototype.render.bind(new (_this48.getComponent())(node));
            return _this48;
        }

        _createClass(Labeled, [{
            key: 'render',
            value: function render(data, error, attributes, children) {
                var cclass = attributes.cclass,
                    cstyle = attributes.cstyle,
                    text = attributes.text,
                    label = attributes.label,
                    html = attributes.html,
                    hideError = attributes.hideError,
                    rest = _objectWithoutProperties(attributes, ['cclass', 'cstyle', 'text', 'label', 'html', 'hideError']);

                return [[html || label || cclass || cstyle ? Core.createElement('label', { class: cclass, style: cstyle, text: label || text, html: html }) : text, _get(Labeled.prototype.__proto__ || Object.getPrototypeOf(Labeled.prototype), 'render', this).call(this, null, error, { hideError: hideError })]].concat(_toConsumableArray(this.renderComponent(data, null, rest, children)));
            }
        }]);

        return Labeled;
    }(ValidationComponent);
});

define('components/c-checkbox', ['dfe-core', 'components/checkbox', 'components/labeled'], function (Core, Checkbox, Labeled) {
    return function (_Labeled) {
        _inherits(LabeledCheckbox, _Labeled);

        function LabeledCheckbox() {
            _classCallCheck(this, LabeledCheckbox);

            return _possibleConstructorReturn(this, (LabeledCheckbox.__proto__ || Object.getPrototypeOf(LabeledCheckbox)).apply(this, arguments));
        }

        _createClass(LabeledCheckbox, [{
            key: 'getComponent',
            value: function getComponent() {
                return Checkbox;
            }
        }]);

        return LabeledCheckbox;
    }(Labeled);
});

define('components/c-editbox', ['dfe-core', 'components/editbox', 'components/labeled'], function (Core, Editbox, Labeled) {
    return function (_Labeled2) {
        _inherits(LabeledEditbox, _Labeled2);

        function LabeledEditbox() {
            _classCallCheck(this, LabeledEditbox);

            return _possibleConstructorReturn(this, (LabeledEditbox.__proto__ || Object.getPrototypeOf(LabeledEditbox)).apply(this, arguments));
        }

        _createClass(LabeledEditbox, [{
            key: 'getComponent',
            value: function getComponent() {
                return Editbox;
            }
        }]);

        return LabeledEditbox;
    }(Labeled);
});

define('components/c-dropdown', ['dfe-core', 'components/dropdown', 'components/labeled'], function (Core, Dropdown, Labeled) {
    return function (_Labeled3) {
        _inherits(LabeledDropdown, _Labeled3);

        function LabeledDropdown() {
            _classCallCheck(this, LabeledDropdown);

            return _possibleConstructorReturn(this, (LabeledDropdown.__proto__ || Object.getPrototypeOf(LabeledDropdown)).apply(this, arguments));
        }

        _createClass(LabeledDropdown, [{
            key: 'getComponent',
            value: function getComponent() {
                return Dropdown;
            }
        }]);

        return LabeledDropdown;
    }(Labeled);
});

define('components/c-editbox-$', ['dfe-core', 'components/editbox-$', 'components/labeled'], function (Core, EditboxMoney, Labeled) {
    return function (_Labeled4) {
        _inherits(LabeledEditboxMoney, _Labeled4);

        function LabeledEditboxMoney() {
            _classCallCheck(this, LabeledEditboxMoney);

            return _possibleConstructorReturn(this, (LabeledEditboxMoney.__proto__ || Object.getPrototypeOf(LabeledEditboxMoney)).apply(this, arguments));
        }

        _createClass(LabeledEditboxMoney, [{
            key: 'getComponent',
            value: function getComponent() {
                return EditboxMoney;
            }
        }]);

        return LabeledEditboxMoney;
    }(Labeled);
});

define('components/c-radiolist', ['dfe-core', 'components/radiolist', 'components/labeled'], function (Core, Radiolist, Labeled) {
    return function (_Labeled5) {
        _inherits(LabeledRadiolist, _Labeled5);

        function LabeledRadiolist() {
            _classCallCheck(this, LabeledRadiolist);

            return _possibleConstructorReturn(this, (LabeledRadiolist.__proto__ || Object.getPrototypeOf(LabeledRadiolist)).apply(this, arguments));
        }

        _createClass(LabeledRadiolist, [{
            key: 'getComponent',
            value: function getComponent() {
                return Radiolist;
            }
        }]);

        return LabeledRadiolist;
    }(Labeled);
});

/*  TODO: 

define('components/editbox-P', ['components/editbox', 'ui/utils'], function(CEditbox, uiUtils) {
    return _extend({
        cname: 'editbox-P',
        render: function (nodes, control, data, errs, attrs, events) {
            if(!defer(nodes, control, data, errs, attrs, events)) {
                var rt = this.runtime(control), self = this;
                if(!control.ui) {
                    nodes[0].appendChild(control.ui = document.createElement('input'))._dfe_ = control;
                    uiUtils.addEventListener(control.ui, 'focus', function(e) { self.showPopup(control) });
                    uiUtils.addEventListener(control.ui, 'click', function(e) { self.showPopup(control) });
                    uiUtils.addEventListener(control.ui, attrs.trigger || 'keyup', function(e) { control.currentValue === control.ui.value || control.component.store(control, control.ui.value) });
                    uiUtils.addEventListener(control.ui, 'keydown', function(e) { 
                        (e.key == 'Esc' || e.key == 'Escape') && rt.ta && control.closePopup();
                        e.key == 'Enter' && (e.preventDefault(), self.showPopup(control), self.getPopupActiveElement(control).focus());
                        e.key == 'Tab' && rt.ta && (self.getPopupActiveElement(control).focus(), e.preventDefault());
                    });
                }
                this.setValue(control, data, errs, attrs);
                this.setAttributes(control, errs, attrs);
                this.appendError(control, nodes[0], errs, attrs);
                this.setPopupAttributes(control, attrs.ta||{}, errs);
                this.updatePopupContent(control, data, attrs);
            }
        },
        setValue: function(control, data, errs, attrs) {
            control.ui.value === data || (control.ui.value = data);
            control.currentValue = control.ui.value;
        },
        updatePopupContent: function(control, data, attrs) {
            var rt = this.runtime(control);
            rt.ta && rt.popup && !rt.ta.contains(control.ui.ownerDocument.activeElement) && (rt.popup.value == data || (rt.popup.value = data, rt.popup.selectionStart = rt.popup.selectionEnd = 0, rt.popup.scrollTop = 0));
        },
        getPopupUi: function(control) {
            var attrs = control.model.attrs, rt = this.runtime(control), p = rt.popup;
            if(!rt.popup) { 
                rt.popup = p = control.ui.ownerDocument.createElement('textarea');
                uiUtils.setAttribute(p, 'class', 'edit-popup-textarea');
                uiUtils.addEventListener(p, attrs.trigger || 'keyup', function(){ 
                    control.component.store(control, control.ui.value = p.value);
                    control.currentValue = p.value;
                });
                uiUtils.addEventListener(p, 'keydown', function(e) { 
                    (e.key == 'Esc' || e.key == 'Escape') && (control.ui.focus(), control.closePopup()) 
                    e.key == 'Tab' && (control.ui.focus(), e.preventDefault()); // ??
                });
            }
            return p;
        },
        onResize: function(control) {},
        getPopupActiveElement: function(control) { 
            return this.runtime(control).popup 
        },
        onClosePopup: function(control) {},
        purge: function (control) { control.closePopup && rt.ta && control.closePopup(); this.emptyUI(control); },
        showPopup: function(control) {
            var rt = this.runtime(control), scrollFollow, escUnf, doc = control.ui.ownerDocument, self = this;
            if(control.ui && !rt.ta) {
                this.createPopup(control);
                this.updatePopupContent(control, control.data, control.model.attrs);
                (scrollFollow = function() {
                    var r = control.ui.getBoundingClientRect(), op = control.ui.offsetParent, wnd = doc.defaultView||window;
                    rt.ta.style.display = (op.scrollTop > control.ui.offsetTop + control.ui.offsetHeight || op.scrollTop + op.clientHeight < control.ui.offsetTop + control.ui.offsetHeight) ? 'none' : '';
                    rt.ta.style.top = (r.bottom + 2 + (wnd.scrollY||wnd.pageYOffset) + (rt.ta_t||0)) + 'px';
                    rt.ta.style.left = (r.left + (wnd.scrollX||wnd.pageXOffset) + (rt.ta_l||0)) + 'px';
                })();
                for(var e = control.ui; e; e = e.parentElement) e.addEventListener('scroll', scrollFollow);
                var i = setInterval(function() {
                    doc.activeElement != control.ui && !rt.resizeOngoing && ! rt.ta.contains(doc.activeElement) && control.closePopup();
                }, 30);
                control.closePopup = function() {
                    for(var e = control.ui; e; e = e.parentElement) uiUtils.removeEventListener(e, 'scroll', scrollFollow);
                    uiUtils.removeEventListener(self.getPopupActiveElement(control), 'keydown', escUnf);
                    clearInterval(i);
                    self.onClosePopup(control);
                    uiUtils.removeNode(rt.ta);
                    delete rt.ta;
                }
                uiUtils.addEventListener(self.getPopupActiveElement(control), 'keydown', (escUnf = function(e) { 
                    e.key == 'Escape' && !e.defaultPrevented && (control.ui.focus(), control.closePopup());
                }));
            }    
        },
        createPopup: function(control) {
            var rt = this.runtime(control), doc = control.ui.ownerDocument, attrs = control.model.attrs, handle, self = this;
            rt.ta = doc.createElement('div'); 
            rt.ta.appendChild(this.getPopupUi(control));
            rt.ta.appendChild(handle = document.createElement('span'));
            doc.getElementsByTagName('body')[0].appendChild(rt.ta);
            this.setPopupAttributes(control, attrs.ta||{}, control.error);
            handle.setAttribute('class', 'ui-resizeable-handle-br');
            handle.addEventListener('mousedown', function(ie) {
                rt.resizeOngoing = 1;
                var ox = ie.screenX, oy = ie.screenY, w = rt.ta.offsetWidth, h = rt.ta.offsetHeight, move, up;
                document.addEventListener('mousemove', move = function(me) {
                    self.onResize(control);
                    rt.ta.style.width = rt.ta_w = (w + me.screenX - ox) + 'px';
                    rt.ta.style.height = rt.ta_h = (h + me.screenY - oy) + 'px';
                    me.preventDefault(), window.getSelection().removeAllRanges();
                });
                document.addEventListener('mouseup', up = function(me) {
                    rt.resizeOngoing = 0;
                    uiUtils.removeEventListener(document, 'mousemove', move);
                    uiUtils.removeEventListener(document, 'mouseup', up);
                    self.getPopupActiveElement(control).focus();
                });
            });
        },
        setPopupAttributes: function(control, attrs, errs) {
            var rt = this.runtime(control);
            if(rt.ta) {
                var st = rt.ta.style, w = st.width||rt.ta_w, h = st.height||rt.ta_h, t = st.top, l = st.left;
                rt.ta_l = attrs.offsetLeft, rt.ta_t = attrs.offsetTop; 
                attrs['class'] = (attrs['class']||'') + (errs && attrs.eclass ? ' ' + attrs.eclass : '');
                this.setAttributesUI(rt.ta, errs, attrs);
                w && (st.width = w), h && (st.height = h), t && (st.top = t), l && (st.left = l);
            }
        }
    }, CEditbox, _base())
})
*/

define("forms/corecomm/quote.cmau.car",["require", "dfe-core", "dfe-common", "dfe-field-helper", "components/div-button", "components/label", "components/button", "components/div", "components/c-radiolist", "components/c-editbox", "components/c-dropdown", "components/c-editbox-$", "components/table", "components/tab-s", "components/editbox", "components/dropdown", "components/either", "components/labeled-component", "components/container", "components/inline-rows", "components/c-checkbox"], function (require, Core, cmn, _fields, DivButton, Label, Button, Div, LabeledRadiolist, LabeledEditbox, LabeledDropdown, LabeledEditboxMoney, Table, TabS, Editbox, Dropdown, Either, Labeled, Container, InlineRows, LabeledCheckbox) {
    var Form = Core.Form;

    var carDefaults = {
        losspayee: [{
            losspayeeInd: "N",
            ailessorInd: "N",
            haownInd: "N"
        }],
        emplessor: "N",
        PhysDmgInd: "N",
        DumpingOpInd: "N",
        vinoverride: "N",
        hasvin: "Y",
        custom: "N",
        UseClassInd1: "N",
        UseClassInd2: "N",
        coverages: [{
            pip: [{
                IncludeInd: "N"
            }],
            liab: [{
                IncludeInd: "Y"
            }],
            towlabor: [{
                towlabor: "No Coverage"
            }]
        }]
    };

    var typeMap = {
        car: {
            name: "Private Passenger Type",
            btn: "Passenger Vehicles"
        },
        truck: {
            name: "Trucks, Tractors and Trailers"
        },
        golf: {
            name: "Golf Carts and Low Speed Vehicles"
        },
        mobile: {
            name: "Mobile Homes"
        },
        antique: {
            name: "Antique Autos"
        }
    };

    var VinNumber = function (_LabeledEditbox) {
        _inherits(VinNumber, _LabeledEditbox);

        function VinNumber() {
            _classCallCheck(this, VinNumber);

            return _possibleConstructorReturn(this, (VinNumber.__proto__ || Object.getPrototypeOf(VinNumber)).apply(this, arguments));
        }

        _createClass(VinNumber, [{
            key: 'render',
            value: function render(data, error, attributes) {
                var structure = _get(VinNumber.prototype.__proto__ || Object.getPrototypeOf(VinNumber.prototype), 'render', this).call(this, data.vin, error, _extends({}, attributes, { ref: function ref(dom) {
                        return dom.focus(), dom.select();
                    } }));
                data.vinvalid === 'Y' || data.vin && (structure[1][1] = 'vin not found'); // hax(!)
                return structure;
            }
        }]);

        return VinNumber;
    }(LabeledEditbox);

    function vehDetailsDisabled($$) {
        return $$('.hasvin') == 'Y' && ($$('.vinnumber') == 0 || $$('.vinoverride') != 'Y');
    }

    var VehDetailsChoice = function (_Form) {
        _inherits(VehDetailsChoice, _Form);

        function VehDetailsChoice() {
            _classCallCheck(this, VehDetailsChoice);

            return _possibleConstructorReturn(this, (VehDetailsChoice.__proto__ || Object.getPrototypeOf(VehDetailsChoice)).apply(this, arguments));
        }

        _createClass(VehDetailsChoice, null, [{
            key: 'fields',
            value: function fields(children, config) {
                return Form.field(Labeled, {
                    atr: function atr() {
                        return {
                            style: 'padding-left: 10px',
                            html: '<a href="javascript:showHelp(\'/cmau_help.html#' + config.helpId + '\')" class="css-qmark"></a>' + config.label,
                            errorwatch: true
                        };
                    }
                }, Form.field(Either, {
                    val: config.validation,
                    atr: function atr($$) {
                        return {
                            first: vehDetailsDisabled($$) || $$('.custom') == 'Y'
                        };
                    }
                }, Form.field(Editbox, {
                    atr: function atr($$) {
                        return _fields.simple(config.field, {
                            pattern: config.pattern,
                            disabled: vehDetailsDisabled($$),
                            style: 'width: 150px; text-transform: uppercase;',
                            hideError: true
                        });
                    }
                }), Form.field(Dropdown, {
                    atr: function atr($$) {
                        return _fields.ajaxChoice(config.field, {
                            query: _extends({}, config.ajaxOptions($$), {
                                method: 'CMAUVehicleScriptHelper',
                                action: config.action
                            })
                        }, {
                            disabled: vehDetailsDisabled($$) || $$('.custom') == 'Y',
                            hideError: true
                        });
                    }
                })));
            }
        }]);

        return VehDetailsChoice;
    }(Form);

    var ApplyToAllField = function (_Form2) {
        _inherits(ApplyToAllField, _Form2);

        function ApplyToAllField() {
            _classCallCheck(this, ApplyToAllField);

            return _possibleConstructorReturn(this, (ApplyToAllField.__proto__ || Object.getPrototypeOf(ApplyToAllField)).apply(this, arguments));
        }

        _createClass(ApplyToAllField, null, [{
            key: 'fields',
            value: function fields(children, config) {
                return [].concat(_toConsumableArray(children), [Form.field(Button, {
                    get: function get() {
                        return 'Apply to all ' + (config.type ? typeMap[config.type].btn || typeMap[config.type].name : 'Vehicles');
                    },
                    set: function set($$, value) {
                        return $$('...location.car').forEach(function (car) {
                            return config.type && car.data.vehicletype != config.type || car.set(config.field, $$(config.field));
                        });
                    },
                    atr: function atr() {
                        return { class: 'link-button' };
                    }
                })]);
            }
        }]);

        return ApplyToAllField;
    }(Form);

    var QuoteCmauCarForm = function (_Form3) {
        _inherits(QuoteCmauCarForm, _Form3);

        function QuoteCmauCarForm(node) {
            _classCallCheck(this, QuoteCmauCarForm);

            var _this57 = _possibleConstructorReturn(this, (QuoteCmauCarForm.__proto__ || Object.getPrototypeOf(QuoteCmauCarForm)).call(this, node));

            node.unboundModel.get('policy.cmau.location').forEach(function (loc) {
                return loc.defaultSubset('.car', carDefaults).forEach(function (car) {
                    return car.get('.hasvin') == 'Y' && QuoteCmauCarForm.vehProcessVin(car);
                });
            });
            return _this57;
        }

        _createClass(QuoteCmauCarForm, null, [{
            key: 'fields',
            value: function fields() {
                return Form.field(Container, "root", {
                    get: function get($$) {
                        return $$('policy.cmau');
                    }
                }, [Form.field(TabS, "locs", {
                    get: function get($$) {
                        return $$('.location');
                    },
                    val: function val($$) {
                        return $$.required('.location');
                    },
                    atr: function atr() {
                        return {
                            haclass: 'tab-item-active',
                            focusnew: 1,
                            headField: 'loc-hdr',
                            rowclass$header: 'tab-header',
                            rowclass: 'tab-body',
                            rowstyle: 'display: block; width: 900px;'
                        };
                    }
                }, [Form.field(DivButton, "loc-hdr", {
                    get: function get($$) {
                        return ('<a style="color: #444">Location #' + ($$.index(2) + 1) + '</a><br/>' + $$('.city') + ' ' + $$('.state') + ' ' + $$('.zip') + '-' + $$('.zipaddon')).replace(/-$/, '');
                    },
                    atr: function atr($$) {
                        return {
                            class: 'div-button',
                            errorwatch: { target: 'peers', accept: function accept() {
                                    return 'error';
                                } }
                        };
                    },
                    layout: [{
                        class: "tab-item"
                    }]
                }), Form.field(Div, "loc-title1", {
                    layout: [{
                        class: "inline-section-header"
                    }]
                }, [Form.field(Label, "field-159", {
                    get: function get($$) {
                        return 'Location #' + ($$.index() + 1);
                    }
                }), Form.field(Button, "add-car", {
                    get: function get() {
                        return 'Add Vehicle';
                    },
                    set: function set($$) {
                        return $$.append('.car', carDefaults);
                    },
                    atr: function atr() {
                        return {
                            style: 'padding: 1px 10px'
                        };
                    },
                    layout: [{
                        style: "position: absolute; right: 5px; top: 5px"
                    }]
                })]), Form.field(TabS, "cars", {
                    get: function get($$) {
                        return $$('.car');
                    },
                    val: function val($$) {
                        return $$.required('.car');
                    },
                    atr: function atr() {
                        return {
                            haclass: 'tab-item-active',
                            focusnew: 1,
                            headField: 'car-hdr',
                            style: 'width: 100%;',
                            rowclass$header: 'tab-header',
                            rowclass: 'tab-body',
                            rowstyle: 'padding: 0px; overflow: hidden;'
                        };
                    },
                    layout: [{
                        style: "width: 100%; "
                    }]
                }, [Form.field(DivButton, "car-hdr", {
                    get: function get($$) {
                        return $$('..state') + ' - Vehicle #' + ($$.index() + 1) + '<br/>' + $$('.ModelYr') + ' ' + $$('.make');
                    },
                    atr: function atr($$) {
                        return {
                            class: 'div-button',
                            errorwatch: { target: 'peers', accept: function accept() {
                                    return 'error';
                                } }
                        };
                    },
                    layout: [{
                        class: "tab-item"
                    }]
                }), Form.field(Table, "info", {
                    atr: function atr($$) {
                        var skip = $$('.hasvin') != 'Y' || $$('.vinvalid') == 'Y' || $$('.vinnumber') == 0 ? ['override'] : [];
                        vehDetailsDisabled($$) && skip.push('custom');
                        return {
                            singleColumn: true,
                            class: 'dfe-table tab-cols-5-5',
                            skip: skip
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-154", {
                    get: function get($$) {
                        return 'Vehicle #' + ($$.index() + 1);
                    },
                    layout: [{
                        colSpan: "2",
                        class: "inline-section-header"
                    }]
                }), Form.field(LabeledRadiolist, "field-9", {
                    set: function set($$, value) {
                        $$.set('.hasvin', value), 'Y' == value && QuoteCmauCarForm.vehProcessVin($$);
                    },
                    get: function get($$) {
                        return $$('.hasvin');
                    },
                    atr: function atr() {
                        return {
                            orientation: 'horizontal',
                            text: 'Do you have the VIN?'
                        };
                    }
                }), Form.field(InlineRows, { get: function get($$) {
                        return $$('.hasvin') == 'Y' ? [$$] : [];
                    } }, Form.field(VinNumber, "vin", {
                    get: function get($$) {
                        return { vin: $$('.vinnumber'), vinvalid: $$('.vinvalid') };
                    },
                    set: function set($$, value) {
                        $$.set('.vinnumber', value);
                        QuoteCmauCarForm.vehProcessVin($$);
                    },
                    val: function val($$) {
                        return $$('.vinoverride') == 'Y' || $$.required('.vinnumber') && $$.required('.vinnumber', /[a-zA-Z0-9]{17}/, 'Invalid VIN format') && ($$('.vinvalid') == 'Y' || $$.error('Vin not found'));
                    },
                    atr: function atr($$) {
                        return {
                            spellcheck: 'false',
                            disabled: $$('.hasvin') != 'Y',
                            style: 'width: 150px; text-transform: uppercase; display: block;',
                            pattern: /[a-zA-Z0-9]{1,17}/,
                            text: 'Vihicle Identification Number (VIN)'
                        };
                    }
                })), Form.field(LabeledRadiolist, "override", {
                    atr: function atr() {
                        return _fields.simple('.vinoverride', [], {
                            cstyle: 'padding-left: 10px;',
                            orientation: 'horizontal',
                            text: 'Override VIN?'
                        });
                    }
                }), Form.field(LabeledRadiolist, "custom", {
                    atr: function atr() {
                        return _fields.simple('.custom', [], {
                            cstyle: 'padding-left: 10px;',
                            orientation: 'horizontal',
                            text: 'Vehicle Year, Make and/or Model is not available in dropdown'
                        });
                    }
                }), Form.field(LabeledDropdown, "type-choice", {
                    atr: function atr($$) {
                        return _fields.choice('.vehicletype', Object.keys(typeMap).map(function (k) {
                            return {
                                value: k,
                                description: typeMap[k].name
                            };
                        }), {
                            disabled: vehDetailsDisabled($$),
                            text: 'Vehicle Type',
                            style: 'width: fit-content;'
                        });
                    }
                }), Form.field(VehDetailsChoice, "year-option", {
                    config: {
                        validation: function validation($$) {
                            return $$.required('.ModelYr', /(18|19|20)\d{2}/);
                        },
                        field: '.ModelYr',
                        pattern: /\d{1,4}/,
                        helpId: 'year',
                        label: 'Vehicle Year',
                        action: 'getYearOptions',
                        ajaxOptions: function ajaxOptions($$) {
                            return {
                                vehicleType: $$('.vehicletype')
                            };
                        }
                    }
                }), Form.field(VehDetailsChoice, "make-option", {
                    config: {
                        validation: function validation($$) {
                            return $$.required('.make', /[-\w ]{1,50}/);
                        },
                        field: '.make',
                        helpId: 'make',
                        label: 'Vehicle Make',
                        action: 'getMakeOptions',
                        ajaxOptions: function ajaxOptions($$) {
                            return {
                                vehicleType: $$('.vehicletype'),
                                vehicleYear: $$('.ModelYr')
                            };
                        }
                    }
                }), Form.field(VehDetailsChoice, "model-option", {
                    config: {
                        validation: function validation($$) {
                            return $$.required('.make', /[-\w ]{1,50}/);
                        },
                        field: '.modelinfo',
                        helpId: 'model',
                        label: 'Vehicle Model',
                        action: 'getModelOptions',
                        ajaxOptions: function ajaxOptions($$) {
                            return {
                                vehicleType: $$('.vehicletype'),
                                vehicleYear: $$('.ModelYr'),
                                vehicleMake: $$('.make')
                            };
                        }
                    }
                }), Form.field(LabeledEditboxMoney, "costnew-free", {
                    atr: function atr($$) {
                        return _fields.simple('.vehicleocostnew', {
                            disabled: vehDetailsDisabled($$),
                            style: 'width: 150px;',
                            formatting: '$9,999,999',
                            text: 'Original Cost New'
                        });
                    }
                })]), Form.field(Table, "private", {
                    get: function get($$) {
                        return $$('.vehicletype') == 'car' ? [$$] : [];
                    },
                    atr: function atr() {
                        return {
                            class: 'dfe-table col-3-centred tab-cols-2-5-3',
                            singleColumn: true
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-36", {
                    get: function get() {
                        return 'Private Passenger Auto';
                    },
                    layout: [{
                        colSpan: "3",
                        class: "inline-section-header"
                    }]
                }), Form.field(ApplyToAllField, "field-34", { config: { type: 'car', field: '.VehUseCd' } }, [Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.VehUseCd', ['Furnished for Non-Business Use', 'All Other'], { text: 'Usage' });
                    }
                })]), Form.field(InlineRows, "nonbus", { get: function get($$) {
                        return $$('.VehUseCd') == 'Furnished for Non-Business Use' ? [$$] : [];
                    } }, [Form.field(ApplyToAllField, "field-38", { config: { type: 'car', field: '.OperExp' } }, [Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.OperExp', ['No operator licensed less than 5 years', 'Licensed less than 5 yrs not owner or principal operator', 'Owner or principal operator licensed less than 5 yrs'], { text: 'Operator Experience', cstyle: 'padding-left: 10px' });
                    }
                })]), Form.field(ApplyToAllField, "field-42", { config: { type: 'car', field: '.OperUse' } }, [Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.OperUse', ['Not driven to work or school', 'To of from work less than 15 miles', 'To or from work 15 or more miles'], { text: 'Operator Use', cstyle: 'padding-left: 10px' });
                    }
                })])])]), Form.field(Table, "truck", {
                    get: function get($$) {
                        return $$('.vehicletype') == 'truck' ? [$$] : [];
                    },
                    atr: function atr($$) {
                        return {
                            class: 'dfe-table col-va-middle col-3-centred tab-cols-3-4-3',
                            singleColumn: true
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-49", {
                    get: function get() {
                        return 'Trucks, Tractors and Trailers';
                    },
                    layout: [{
                        colSpan: "3",
                        class: "inline-section-header"
                    }]
                }), Form.field(ApplyToAllField, "field-51", { config: { type: 'truck', field: '.VehicleClass' } }, [Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.VehicleClass', ['Light Truck 10,000 lbs GVW or less', 'Medium Truck 10,001 to 20,000 lbs GVW', 'Heavy Truck 20,001 to 45,000 lbs GVW', 'Extra-Heavy Truck over 45,000 lbs GVW', 'Heavy Truck-Tractor 45,000 lbs GCW or less', 'Extra-Heavy Truck-Tractor over 45,000 lbs GCW', 'Trailer Types'], { text: 'Vehicle Class' });
                    }
                })]), Form.field(InlineRows, "tt-switch", { get: function get($$) {
                        return $$('.VehicleClass') == 'Trailer Types' ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-55", { config: { type: 'truck', field: '.TrailerType' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.TrailerType', ['Semitrailers', 'Trailers', 'Service or Utility Trailer (0-200 lbs. Load Capacity)'], { text: 'Trailer Type' });
                    }
                }))), Form.field(ApplyToAllField, "field-58", { config: { type: 'truck', field: '.UseClassInd1' } }, Form.field(LabeledRadiolist, {
                    atr: function atr() {
                        return _fields.simple('.UseClassInd1', { text: 'Is this auto used for transporting personnel, tools and equipment to and from a job location where it is parked for the majority of the day?' });
                    }
                })), Form.field(ApplyToAllField, "field-59", { config: { type: 'truck', field: '.UseClassInd2' } }, Form.field(LabeledRadiolist, {
                    atr: function atr() {
                        return _fields.simple('.UseClassInd2', { text: 'Is this auto used for pick-up and/or delivery of property to residential households?' });
                    }
                })), Form.field(ApplyToAllField, "field-65", { config: { type: 'truck', field: '.RadiusClass' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.RadiusClass', ['Local up to 50 miles', 'Intermediate 51 to 200 miles', 'Long distance over 200 miles'], { text: 'Radius' });
                    }
                })), Form.field(ApplyToAllField, "field-68", { config: { type: 'truck', field: '.DumpingOpInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.DumpingOpInd', [], { text: 'Used in dumping' });
                    }
                })), Form.field(ApplyToAllField, "field-71", { config: { type: 'truck', field: '.SecondaryClass' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.SecondaryClass', ['Truckers', 'Food Delivery', 'Waste Disposal', 'Farmers', 'Dump & Transit Mix', 'Contractors', 'Not Otherwise Specified'], { style: 'width: fit-content', text: 'Secondary Class' });
                    }
                })), Form.field(ApplyToAllField, "field-74", { config: { type: 'truck', field: '.SecondaryClassType' } }, Form.field(LabeledDropdown, {
                    atr: function atr($$) {
                        return _fields.ajaxChoice('.SecondaryClassType', {
                            method: 'CMAUVehicleScriptHelper',
                            action: 'getSecondaryClassTypeOptions',
                            secondaryClass: $$('.SecondaryClass')
                        }, {
                            style: 'width: fit-content', text: 'Secondary Class Type'
                        });
                    }
                }))]), Form.field(Table, "golf", {
                    get: function get($$) {
                        return $$('.vehicletype') == 'golf' ? [$$] : [];
                    },
                    atr: function atr() {
                        return {
                            class: 'dfe-table col-3-centred tab-cols-4-3-3',
                            singleColumn: true
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-122", {
                    get: function get() {
                        return 'Golf Carts and Low Speed Vehicles';
                    },
                    layout: [{
                        colSpan: "3",
                        class: "inline-section-header"
                    }]
                }), Form.field(ApplyToAllField, "field-125", { config: { type: 'golf', field: '.GolfType' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.GolfType', ['Golf Cart', 'Low Speed Vehicles'], { style: 'width: fit-content', text: 'Type' });
                    }
                })), Form.field(ApplyToAllField, "field-128", { config: { type: 'golf', field: '.GolfUse' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.GolfUse', ['Used On Golf Course', 'Other Commercial Purposes'], { style: 'width: fit-content', text: 'Use' });
                    }
                })), Form.field(ApplyToAllField, "field-131", { config: { type: 'golf', field: '.GolfVhsub' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.GolfVhsub', [], { text: 'Vehicle subject to compulsory, financial or other law' });
                    }
                }))]), Form.field(Table, "mobile", {
                    get: function get($$) {
                        return $$('.vehicletype') == 'mobile' ? [$$] : [];
                    },
                    atr: function atr($$) {
                        return {
                            class: 'dfe-table col-3-centred tab-cols-2-5-3',
                            singleColumn: true
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-123", {
                    get: function get() {
                        return 'Mobile Homes';
                    },
                    layout: [{
                        colSpan: "3",
                        class: "inline-section-header"
                    }]
                }), Form.field(ApplyToAllField, "field-134", { config: { type: 'mobile', field: '.MobileHomeType' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.MobileHomeType', ['Trailer Equipped As Living Quarters', 'Pickup Trucks Used Solely To Transport Camper Bodies', 'Motor Homes Self-Propelled Equipped As Living Quarters'], { style: 'width: fit-content', text: 'Type' });
                    }
                })), Form.field(InlineRows, "size-switch", { get: function get($$) {
                        return $$('.MobileHomeType') == 'Motor Homes Self-Propelled Equipped As Living Quarters' ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-138", { config: { type: 'mobile', field: '.MotorHomeSize' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.MotorHomeSize', ['Up To 22 feet', 'More Than 22 feet'], { style: 'width: fit-content', text: 'Length' });
                    }
                })))]), Form.field(Table, "covs", {
                    atr: function atr($$) {
                        return {
                            class: 'dfe-table col-3-centred tab-cols-4-3-3',
                            singleColumn: true
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-77", {
                    get: function get() {
                        return 'Coverages';
                    },
                    layout: [{
                        colSpan: "3",
                        class: "inline-section-header"
                    }]
                }), Form.field(ApplyToAllField, "field-81", { config: { field: '.PhysDmgInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.PhysDmgInd', [], { text: 'Physical Damage Only?' });
                    }
                })), Form.field(ApplyToAllField, "field-82", { config: { field: '.coverages.otc.ded' } }, Form.field(LabeledDropdown, {
                    atr: function atr($$) {
                        return _fields.ajaxChoice('.coverages.otc.ded', {
                            query: {
                                method: 'CMAUVehicleScriptHelper',
                                action: 'getCompDedOptions',
                                vehicleType: $$('.vehicletype')
                            },
                            mapper: function mapper(o) {
                                return { value: o.value, description: o.text };
                            }
                        }, { text: 'Comp. Ded' });
                    }
                })), Form.field(ApplyToAllField, "field-85", { config: { field: '.coverages.col.ded' } }, Form.field(LabeledDropdown, {
                    atr: function atr($$) {
                        return _fields.ajaxChoice('.coverages.col.ded', {
                            query: {
                                method: 'CMAUVehicleScriptHelper',
                                action: 'getCollDedOptions',
                                vehicleType: $$('.vehicletype')
                            },
                            mapper: function mapper(o) {
                                return { value: o.value, description: o.text };
                            }
                        }, { text: 'Coll. Ded' });
                    }
                })), Form.field(InlineRows, "val-switch", { get: function get($$) {
                        return ($$('.coverages.col.ded') + $$('.coverages.otc.ded')).toString().match(/\d|Full/) ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-88", { config: { field: '.ValuationMethod' } }, Form.field(LabeledDropdown, {
                    atr: function atr($$) {
                        return _fields.ajaxChoice('.ValuationMethod', {
                            method: 'CMAUVehicleScriptHelper',
                            action: 'getValuationMethodOptions',
                            vehicleType: $$('.vehicletype')
                        }, { text: 'Valuation' });
                    }
                }))), Form.field(InlineRows, "amt-switch", { get: function get($$) {
                        return ($$('.coverages.col.ded') + $$('.coverages.otc.ded')).toString().match(/\d|Full/) && $$('.ValuationMethod') == 'Stated Amount' ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-92", { config: { field: '.StatedAmt' } }, Form.field(LabeledEditboxMoney, {
                    atr: function atr() {
                        return _fields.simple('.StatedAmt', { formatting: '$9,999,999', text: 'Stated Amount', cstyle: 'padding-left: 10px;', style: 'width: 100px' });
                    }
                }))), Form.field(InlineRows, "pdonly-switch", { get: function get($$) {
                        return $$('.PhysDmgInd') == 'Y' || $$('..state') != 'KS' ? [] : [$$];
                    } }, Form.field(ApplyToAllField, "field-96", { config: { field: '.coverages.pip.IncludeInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.coverages.pip.IncludeInd', [], { text: 'Personal Injury Protection Coverage' });
                    }
                })), Form.field(InlineRows, "pip-switch", { get: function get($$) {
                        return $$('.coverages.pip.IncludeInd') == 'Y' ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-100", { config: { field: '.coverages.pip.addedpipoption' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.coverages.pip.addedpipoption', ['Option 1', 'Option 2'], { cstyle: 'padding-left: 10px', style: 'width: fit-content', text: 'Additional Personal Injury Protection' });
                    }
                })), Form.field(ApplyToAllField, "field-103", { config: { field: '.coverages.pip.broadpipnum' } }, Form.field(LabeledEditbox, {
                    atr: function atr() {
                        return _fields.simple('.coverages.pip.broadpipnum', { pattern: '[0-9]{1,5}', cstyle: 'padding-left: 10px', style: 'width: 80px', text: 'Number of Individuals for Broadened PIP' });
                    }
                })), Form.field(InlineRows, "added-pip", { get: function get($$) {
                        return +$$('.coverages.pip.broadpipnum') > 0 ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-145", { config: { field: '.coverages.pip.addedbroadpipnum' } }, Form.field(LabeledEditbox, {
                    atr: function atr() {
                        return _fields.simple('.coverages.pip.addedbroadpipnum', { pattern: '[0-9]{1,5}', cstyle: 'padding-left: 10px', style: 'width: 80px', text: 'Number of Named Individuals for Additional Broadened PIP' });
                    }
                })), Form.field(InlineRows, "added-pip-s", { get: function get($$) {
                        return +$$('.coverages.pip.addedbroadpipnum') ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-149", { config: { field: '.coverages.pip.addedbpipoptioncd' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.coverages.pip.addedbpipoptioncd', ['Option 1', 'Option 2'], { cstyle: 'padding-left: 10px', style: 'width: fit-content', text: 'Additional Broadened Personal Injury Protection' });
                    }
                }))))))]), Form.field(Table, "opt-covs", {
                    atr: function atr($$) {
                        return {
                            class: 'dfe-table col-3-centred tab-cols-4-3-3',
                            skip: $$('..state') == 'KS' ? ['field-111', 'field-114'] : ['field-113'],
                            singleColumn: true
                        };
                    },
                    layout: [{
                        class: "dfe-inline-section"
                    }]
                }, [Form.field(Label, "field-106", {
                    get: function get() {
                        return 'Optional Coverages';
                    },
                    layout: [{
                        colSpan: "3",
                        class: "inline-section-header"
                    }]
                }), Form.field(InlineRows, "towing-switch", { get: function get($$) {
                        return $$('.vehicletype') == 'car' && $$('.coverages.otc.ded').toString().match(/\d|Full/) ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-118", { config: { field: '.coverages.towlabor.towlabor' } }, Form.field(LabeledDropdown, {
                    atr: function atr() {
                        return _fields.choice('.coverages.towlabor.towlabor', _fields.choiceItems({
                            'No Coverage': 'No Coverage',
                            $50: '50',
                            $100: '100',
                            $200: '200'
                        }), { style: 'width: fit-content', text: 'Towing and Labor' });
                    }
                }))), Form.field(ApplyToAllField, "field-108", { config: { field: '.losspayee.losspayeeInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.losspayee.losspayeeInd', [], { text: 'Loss Payee' });
                    }
                })), Form.field(ApplyToAllField, "field-111", { config: { field: '.losspayee.ailessorInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.losspayee.ailessorInd', [], { text: 'Additional Insured - Lessor' });
                    }
                })), Form.field(ApplyToAllField, "field-114", { config: { field: '.losspayee.haownInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.losspayee.haownInd', [], { text: 'Hired Auto - Specified As Covered Auto You Own' });
                    }
                })), Form.field(ApplyToAllField, "field-157", { config: { field: '.emplessor' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.emplessor', [], { text: 'Employee as Lessor' });
                    }
                })), Form.field(InlineRows, "field-113", Form.field(ApplyToAllField, "field-116", { config: { field: '.losspayee.namedinsuredInd' } }, Form.field(LabeledCheckbox, {
                    atr: function atr() {
                        return _fields.simple('.losspayee.namedinsuredInd', [], { text: 'Additional Named Insured' });
                    }
                })), Form.field(InlineRows, "field-120", { get: function get($$) {
                        return $$('.losspayee.namedinsuredInd') == 'Y' ? [$$] : [];
                    } }, Form.field(ApplyToAllField, "field-121", { config: { field: '.losspayee.namedInsured.Name' } }, Form.field(LabeledEditbox, {
                    atr: function atr() {
                        return _fields.simple('.losspayee.namedInsured.Name', [], { cstyle: 'padding-left: 10px;', html: '<b style="color: red">*</b>Name' });
                    }
                }))))]), Form.field(Div, "car-ctrl", {
                    atr: function atr($$) {
                        return {
                            skip: $$('..car').length > 1 ? [] : ['remove-car'],
                            style: 'padding: 5px; text-align: right; background: lightgray;'
                        };
                    },
                    layout: [{
                        style: "padding: 2px 0px"
                    }]
                }, [Form.field(Button, "clone-car", {
                    get: function get() {
                        return 'Clone Vehicle';
                    },
                    set: function set($$) {
                        return $$.clone();
                    },
                    atr: function atr() {
                        return {
                            style: 'padding: 1px 10px; margin: 0px 5px'
                        };
                    },
                    layout: [{
                        style: "display: inline-block"
                    }]
                }), Form.field(Button, "remove-car", {
                    get: function get() {
                        return 'Remove Vehicle';
                    },
                    set: function set($$) {
                        return $$.detach();
                    },
                    atr: function atr() {
                        return {
                            style: 'padding: 1px 10px; margin: 0px 5px'
                        };
                    },
                    layout: [{
                        style: "display: inline-block"
                    }]
                })])])])]);
            }
        }, {
            key: 'vehProcessVin',
            value: function vehProcessVin($$) {
                $$.get('.vinnumber').length == 17 ? ajaxCache.get({
                    method: 'CMAUVehicleScriptHelper',
                    action: 'getVinLookupResults',
                    vinNumber: $$.get('.vinnumber')
                }).then(function (data) {
                    var r = data.result,
                        isTrailer = r.vehicleType == 'x';
                    $$.set(r.isMatch ? {
                        vinvalid: 'Y',
                        vehicletype: isTrailer ? 'truck' : r.vehicleType,
                        ModelYr: r.vehicleYear,
                        make: r.vehicleMake,
                        modelinfo: r.vehicleModel,
                        vehicleocostnew: r.vehicleCost,
                        vinoverride: 'N',
                        VehicleClass: isTrailer ? 'Trailer Types' : $$.get('.VehicleClass')
                    } : {
                        vinvalid: 'N'
                    });
                }, function () {
                    return $$.set('.vinvalid', 'N');
                }) : $$.set('.vinvalid', 'N');
            }
        }]);

        return QuoteCmauCarForm;
    }(Form);
    if (typeof window !== 'undefined') {
        window.showHelp = function (url) {
            window.open(url, 'DetailWin', 'scrollbars=yes,resizable=yes,toolbar=no,height=250,width=250').focus();
        };
    }
    return QuoteCmauCarForm;
});