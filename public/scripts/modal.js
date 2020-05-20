
/**
 * Modal handling
 */
const Modal = {};

/**
 * Show alert box
 * @param {string|JQuery} message
 * @param {function=} callback
 */
Modal.alert = function (message, callback) {
  const e = $('#alert');
  e.modal().one('hidden.bs.modal', callback).find('.modal-body').html(message);
  e.find('.btn').on('click', () => {
    e.modal('hide');
  });
  e.find('.selectpicker').selectpicker();
};

/**
 * Show confirm box
 * @param {string|JQuery} message
 * @param {function=} callback
 */
Modal.confirm = function (message, callback) {
  const e = $('#confirm');
  e.modal().one('hidden.bs.modal', () => {
    if (callback) callback(false);
  }).find('.modal-body').html(message);
  e.find('.btn-primary').on('click', () => {
    if (callback) callback(true);
    callback = null;
    e.modal('hide');
  });
  e.find('.btn-default').on('click', () => {
    if (callback) callback(false);
    callback = null;
    e.modal('hide');
  });
  e.find('.selectpicker').selectpicker();
};

/**
 * Show confirm box
 * @param {string|JQuery} message
 * @param {string} placeholder
 * @param {function=} callback
 */
Modal.prompt = function (message, placeholder, callback) {
  const e = $('#prompt');
  e.modal().one('hidden.bs.modal', () => {
    if (callback) callback(false);
  }).find('.modal-body .message').html(message);
  const i = e.find('.modal-body input');
  i.val('');
  i.off('keyup').on('keyup', (ev) => {
    if (ev.keyCode == 13) {
      if (callback) callback(i.val());
      callback = null;
      e.modal('hide');
    }
  });
  i.attr('placeholder', placeholder);
  e.find('.btn-primary').on('click', () => {
    if (callback) callback(i.val());
    callback = null;
    e.modal('hide');
  });
  e.find('.btn-default').on('click', () => {
    if (callback) callback(false);
    callback = null;
    e.modal('hide');
  });
  i.focus();
  e.find('.selectpicker').selectpicker();
};
