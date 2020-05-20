
View.register('widgets', (messageData) => {
  const widgetTpl = $('.widget-row');
  const container = $('.widgets-installed');

  for (const widgetIndex in messageData.widgets) {
    if (messageData.widgets.hasOwnProperty(widgetIndex)) {
      const widgetRow = messageData.widgets[widgetIndex];
      const widgetEl = widgetTpl.clone().removeClass('hidden');
      const widget = new Widget(widgetIndex);
      const newVersion = widgetRow._latestVersion && widgetRow._latestVersion != widgetRow.version;
      widget.data = {
        manifest: widgetRow,
      };
      widgetEl.attr('data-id', widgetIndex);
      widgetEl.find('strong').text(`${widget.t('name')} v${widgetRow.version}`);
      widgetEl.find('a.github').attr('href', `https://github.com/${widgetRow.repository}`);
      widgetEl.find('small').text(widget.t('description'));
      widgetEl.find('.games .text').text(widgetRow.compatibleGames == 'all' ? 'All' : widgetRow.compatibleGames.join(', '));
      widgetEl.find('.update').text(t(newVersion ? 'widgets.update.available' : 'widgets.update.anyway', { version: widgetRow._latestVersion })).removeClass('hidden');
      if (!newVersion) {
        widgetEl.find('.update').addClass('btn-default').removeClass('btn-info');
      }
      container.append(widgetEl);
    }
  }
  container.on('click', '.update', function () {
    const e = $(this).closest('.widget-row');
    const btn = $(this);
    const id = e.attr('data-id');
    Modal.confirm(t('widgets.update.confirm'), (success) => {
      if (success) {
        btn.remove();
        note(t('widgets.update.progress'), 'info', 6000);
        Socket.send('view', {
          view: 'widgets',
          action: 'update',
          widget: id,
        }, (data) => {
          note(data.message, data.type, 10000);
        });
      }
    });
  });
  $('#content').on('click', '.install', () => {
    const repo = $('#content').find('.widget-url').val();
    if (repo.length && repo.match(/https:\/\/github\.com\/(.*?)\/(.*)/)) {
      const id = repo.match(/https:\/\/github\.com\/([^\/]+\/[^\/\?\#]+)/)[1];
      $.getJSON(`https://raw.githubusercontent.com/${id}/master/manifest.json`, (data) => {
        if (!data || !data.version || !data.compatibleGames || !data.repository) {
          note(t('widgets.install.invalid'), 'danger');
          return;
        }
        Modal.confirm(t('sure'), (success) => {
          if (success) {
            Socket.send('view', {
              view: 'widgets',
              action: 'install',
              widget: id,
            }, (data) => {
              note(data.message, data.type, 10000);
            });
          }
        });
      });
    } else {
      note(t('widgets.install.invalid'), 'danger');
    }
  });
});
