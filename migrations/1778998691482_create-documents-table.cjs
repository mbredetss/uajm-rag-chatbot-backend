/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('documents', {
    id: 'id',
    source: { type: 'varchar(500)', notNull: true },
    type: { type: 'varchar(10)', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'in progress' },
    content: {
      type: 'text'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    error_message: { type: 'text', notNull: false },
    username: { type: 'varchar(100)', notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('documents');
};
