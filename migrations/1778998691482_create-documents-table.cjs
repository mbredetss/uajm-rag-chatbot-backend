/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('documents', {
    id: 'id',
    source: { type: 'varchar(500)', notNull: true },
    type: { type: 'varchar(10)', notNull: true },
    status: { type: 'varchar(20)', notNull: true, default: 'in progress' },
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
  });
};

exports.down = (pgm) => {
  pgm.dropTable('documents');
};
