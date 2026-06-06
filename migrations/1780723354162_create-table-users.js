/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createType('user_role', ['super admin', 'admin']);

  pgm.createTable('users', {
    id: {
      type: 'CHAR(21)',
      primaryKey: true
    },
    username: {
      type: 'VARCHAR(100)',
      notNull: true,
      unique: true
    },
    password: {
      type: 'TEXT',
      notNull: true
    },
    fullName: {
      type: 'VARCHAR(140)',
      notNull: true
    },
    role: {
      type: 'user_role',
      notNull: true,
      default: 'admin'
    },
    createdAt: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropType('user_role');
  pgm.dropTable('users');
};
