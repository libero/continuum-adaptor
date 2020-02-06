// This migration is temporarily disabled until we split the legacy xpub database into multiple ones for each service

// import * as Knex from 'knex';

// export default {
//     up(knex: Knex): Promise<void> {
//         return knex.schema.alterTable('identity', (table: Knex.AlterTableBuilder) => {
//             table.unique(['identifier', 'type'], 'identity_identifier_type_index');
//         });
//     },
//     down(knex: Knex): Promise<void> {
//         return knex.schema.alterTable('identity', (table: Knex.AlterTableBuilder) => {
//             table.dropUnique(['identifier', 'type'], 'identity_identifier_type_index');
//         });
//     },
// };
