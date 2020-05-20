
/**
 * Global Interval Handling
 */
const Interval = {};

/** @type {object} */
Interval.list = {};

/**
 * Create an interval, automatically destroy previous interval if exist
 * @param {string} id
 * @param {function} func
 * @param {number} step
 */
Interval.create = function (id, func, step) {
  Interval.destroy(id);
  Interval.list[id] = setInterval(func, step);
};

/**
 * Destroy an interval
 * @param {string} id
 */
Interval.destroy = function (id) {
  if (typeof Interval.list[id] !== 'undefined' && Interval.list[id] !== null) {
    clearInterval(Interval.list[id]);
    Interval.list[id] = null;
  }
};
