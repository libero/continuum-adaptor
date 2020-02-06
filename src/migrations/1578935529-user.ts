// This migration is temporarily disabled until we split the legacy xpub database into multiple ones for each service

// import * as Knex from 'knex';

// export default {
//     up(knex: Knex): Knex.SchemaBuilder {
//         return knex.schema.createTable('user', (table: Knex.TableBuilder) => {
//             table.uuid('id').unique();
//             table.timestamp('created').defaultTo(knex.fn.now());
//             table.timestamp('updated').defaultTo(knex.fn.now());
//             table.string('default_identity', 32);
//         });
//     },

//     down(knex: Knex): Knex.SchemaBuilder {
//         return knex.schema.dropTable('user');
//     },
// };
