/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('parent_docstore', {
        id: {
            type: 'VARCHAR', 
            primaryKey: true, 
        }, 
        page_content: {
            type: 'TEXT', 
            notNull: true,
        }, 
        metadata: {
            type: 'jsonb',
        }
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('parent_docstore');
};
