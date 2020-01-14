import * as Knex from 'knex';

export default {
    up(knex: Knex): Knex.SchemaBuilder {
        return knex.schema.createTable('identity', (table: Knex.TableBuilder) => {
            table.uuid('id').unique();
            table
                .uuid('user_id')
                .references('id')
                .inTable('public.user');
            table.timestamp('created').defaultTo(knex.fn.now());
            table.timestamp('updated').defaultTo(knex.fn.now());
            table.string('type', 32);
            table.string('indentifier', 32);
            table.string('display_name', 32);
            table.string('email');
        });
    },

    down(knex: Knex): Knex.SchemaBuilder {
        return knex.schema.dropTable('identity');
    },
};
