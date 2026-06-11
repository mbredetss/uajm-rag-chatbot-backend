/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('conversations', {
    id: 'id',
    question: { type: 'text', notNull: true },
    answer: { type: 'text', notNull: true },
    user_id: {type: 'text', notNull: true }, 
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('conversations');
};
