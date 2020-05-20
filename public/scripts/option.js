
/**
 * Some helpful stuff for options handling
 */
const option = {};

/**
 * Create html element from given data
 * @param {string} id
 * @param {string|null} label
 * @param {string|null} info
 * @param {*} value
 * @param {*} data
 * @returns {JQuery}
 */
option.createHtmlFromData = function (id, label, info, value, data) {
  const el = $('<div class="option">');
  el.append('<div class="title spacer"></div><div class="spacer form-element"></div>');
  if (label) {
    el.find('.title').append($('<strong>').text(label));
  }
  if (info) {
    el.find('.title').append($('<small>').text(` ${info}`));
  }
  const formEl = el.find('.form-element');
  let input = null;
  if (data.type == 'switch') {
    formEl.append(`${'<select>'
            + '<option value="1">'}${t('on')}</option>`
            + `<option value="0">${t('off')}</option>`
            + '</select>');
    input = formEl.find('select');
  }
  if (data.type == 'number' || data.type == 'text') {
    formEl.append(`<input type="${data.type}" class="form-control">`);
    input = formEl.find('input');
    if (typeof data.default !== 'undefined') {
      input.attr('placeholder', data.default);
    }
    if (typeof data.min === 'number') {
      input.attr('min', data.min);
    }
    if (typeof data.max === 'number') {
      input.attr('max', data.max);
    }
    if (typeof data.step === 'number') {
      input.attr('step', data.step);
    }
  }
  if (data.type == 'textarea') {
    formEl.append('<textarea class="form-control autoheight">');
    input = formEl.find('textarea');
    if (typeof data.default !== 'undefined') {
      input.attr('placeholder', data.default);
    }
    if (typeof data.rows === 'number') {
      input.attr('rows', data.rows);
    }
  }
  if (data.type == 'select') {
    formEl.append('<select></select>');
    input = formEl.find('select');
    for (let j = 0; j < data.values.length; j++) {
      input.append($('<option></option>')
        .attr('value', data.values[j])
        .html(widget.t(`data.${i}.value.${data.values[j]}`)));
    }
  }

  input.val(option.dbValueToHtml(data.type, value));
  if (input.is('select')) {
    input.selectpicker();
  }

  el.attr('data-id', id);
  el.attr('data-type', data.type);
  return el;
};

/**
 * Get input value for given option element
 * @param {JQuery} el
 * @returns {*}
 */
option.getValueOfElement = function (el) {
  el = $(el).closest('.option');
  if (el.find('select').length) {
    return el.find('select').val();
  }
  return el.find(':input').val();
};

/**
 * Convert given html value to db value
 * @param {string} type
 * @param {string} value
 * @returns {*}
 */
option.htmlValueToDb = function (type, value) {
  if (type == 'switch') return value == '1';
  if (type == 'text' || type == 'textarea') return !value.length ? null : value;
  if (type == 'number') return !value.length ? null : parseFloat(value);
  return value;
};

/**
 * Convert given db value to html
 * @param {string} type
 * @param {string} value
 * @returns {*}
 */
option.dbValueToHtml = function (type, value) {
  if (type == 'switch') return value ? '1' : '0';
  if ((type == 'text' || type == 'number' || type == 'textarea') && value === null) return '';
  return value;
};
