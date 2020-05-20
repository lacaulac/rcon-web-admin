
View.register('servers', (messageData) => {
  // set users
  const select = $("select[name='users']");
  messageData.users.sort();
  for (var i = 0; i < messageData.users.length; i++) {
    select.append($('<option>').attr('value', messageData.users[i]).text(messageData.users[i]));
  }
  if (messageData.editData) {
    $('.btn.save').removeClass('btn-info').addClass('btn-success').attr('data-translate', 'save.edited');
    $('.btn.cancel').removeClass('hidden');
    populateForm($('form').filter("[name='servers']"), messageData.editData);
    $('.btn.delete').removeClass('hidden').on('click', function (ev) {
      const btn = $(this);
      ev.stopPropagation();
      Modal.confirm(t('sure'), (success) => {
        if (success) {
          btn.trigger('submit-form');
        }
      });
    });
  }
  // write to table
  const tbody = $('table.data-table tbody');
  for (var i in messageData.servers) {
    const server = messageData.servers[i];
    tbody.append(`${'<tr>'
            + '<td>'}${server.game.toUpperCase()}</td>`
            + `<td>${server.name}</td>`
            + `<td>${server.rcon_port}</td>`
            + `<td>${server.active === false ? t('no') : t('yes')}</td>`
            + `<td><a href="#servers" data-message="${View.getAttributeMessage({ id: server.id })}" data-translate="edit" `
            + 'class="btn btn-info btn-sm page-link"></a></td>'
            + '</tr>');
  }
});
