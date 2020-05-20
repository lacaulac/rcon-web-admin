
View.register('settings', (messageData) => {
  /**
     * Show server logs modal
     */
  const showRawServerLogs = function () {
    Socket.send('view', {
      view: 'settings',
      action: 'logfiles',
    }, (messageData) => {
      const el = $('<div>');
      const files = messageData.files || [];
      files.sort((a, b) => {
        if (new Date(a.time) > new Date(b.time)) {
          return -1;
        }
        return 1;
      });
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        el.append(
          `<div data-id="${file.file}">`
                    + '<div class="btn btn-info download btn-sm">'
                    + `Log ${file.file} ${(file.size / 1024 / 1024).toFixed(3)}MB (Last modified: ${new Date(file.time).toLocaleString()})`
                    + '</div>'
                    + '</div>',
        );
      }
      el.on('click', '.btn.download', function () {
        const id = $(this).parent().attr('data-id');
        Socket.send('view', {
          view: 'settings',
          action: 'download',
          file: id,
        }, (messageData) => {
          downloadFile(messageData.content, id);
        });
      });
      Modal.alert(el);
    });
  };

  let btn = $('.btn.update');
  btn.on('click', function () {
    const e = $(this);
    Modal.confirm(t('widgets.update.confirm'), (success) => {
      if (success) {
        e.remove();
        note(t('widgets.update.progress'), 'info', 6000);
        Socket.send('view', {
          view: 'settings',
          action: 'update',
        }, (data) => {
          note(data.message, data.type, 10000);
        });
      }
    });
  });
  btn = $('.btn.download');
  btn.on('click', () => {
    showRawServerLogs();
  });
});
