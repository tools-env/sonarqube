/*
 * SonarQube
 * Copyright (C) 2009-2019 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
package org.sonar.server.platform.db.migration.version.v62;

import java.sql.SQLException;
import java.sql.Types;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.sonar.api.utils.System2;
import org.sonar.db.CoreDbTester;

import static java.lang.String.valueOf;

public class MakeOrganizationUuidNotNullOnUserRolesTest {

  private static final String TABLE_USER_ROLES = "user_roles";

  @Rule
  public CoreDbTester db = CoreDbTester.createForSchema(MakeOrganizationUuidNotNullOnUserRolesTest.class,
    "in_progress_user_roles.sql");
  @Rule
  public ExpectedException expectedException = ExpectedException.none();

  private MakeOrganizationUuidNotNullOnUserRoles underTest = new MakeOrganizationUuidNotNullOnUserRoles(db.database());

  @Test
  public void migration_sets_uuid_column_not_nullable_on_empty_table() throws SQLException {
    underTest.execute();

    verifyColumnDefinition();
  }

  @Test
  public void migration_sets_uuid_column_not_nullable_on_populated_table() throws SQLException {
    insertUserRole(1, true);
    insertUserRole(2, true);

    underTest.execute();

    verifyColumnDefinition();
  }

  @Test
  public void migration_fails_if_some_row_has_a_null_uuid() throws SQLException {
    insertUserRole(1, false);

    expectedException.expect(IllegalStateException.class);
    expectedException.expectMessage("Fail to execute");

    underTest.execute();
  }

  private void verifyColumnDefinition() {
    db.assertColumnDefinition(TABLE_USER_ROLES, "organization_uuid", Types.VARCHAR, 40, false);
  }

  private String insertUserRole(long id, boolean hasUuid) {
    String uuid = "uuid_" + id;
    db.executeInsert(
      TABLE_USER_ROLES,
      "ID", valueOf(id),
      "USER_ID", id + 10,
      "ROLE", valueOf(id + 100),
      "ORGANIZATION_UUID", hasUuid ? "uuid_" + id : null);
    return uuid;
  }
}
