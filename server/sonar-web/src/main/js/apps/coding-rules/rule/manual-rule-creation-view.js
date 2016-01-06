/*
 * SonarQube :: Web
 * Copyright (C) 2009-2016 SonarSource SA
 * mailto:contact AT sonarsource DOT com
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
import $ from 'jquery';
import _ from 'underscore';
import ModalFormView from '../../../components/common/modal-form';
import Template from '../templates/rule/coding-rules-manual-rule-creation.hbs';
import latinize from '../../../helpers/latinize';
import { translate } from '../../../helpers/l10n';

export default ModalFormView.extend({
  template: Template,

  ui: function () {
    return _.extend(ModalFormView.prototype.ui.apply(this.arguments), {
      manualRuleCreationKey: '#coding-rules-manual-rule-creation-key',
      manualRuleCreationName: '#coding-rules-manual-rule-creation-name',
      manualRuleCreationHtmlDescription: '#coding-rules-manual-rule-creation-html-description',
      manualRuleCreationSeverity: '#coding-rules-manual-rule-creation-severity',
      manualRuleCreationStatus: '#coding-rules-manual-rule-creation-status',
      manualRuleCreationParameters: '[name]',
      manualRuleCreationCreate: '#coding-rules-manual-rule-creation-create',
      manualRuleCreationReactivate: '#coding-rules-manual-rule-creation-reactivate',
      modalFoot: '.modal-foot'
    });
  },

  events: function () {
    return _.extend(ModalFormView.prototype.events.apply(this.arguments), {
      'input @ui.manualRuleCreationName': 'generateKey',
      'keydown @ui.manualRuleCreationName': 'generateKey',
      'keyup @ui.manualRuleCreationName': 'generateKey',

      'input @ui.manualRuleCreationKey': 'flagKey',
      'keydown @ui.manualRuleCreationKey': 'flagKey',
      'keyup @ui.manualRuleCreationKey': 'flagKey',

      'click #coding-rules-manual-rule-creation-cancel': 'hide',
      'click @ui.manualRuleCreationCreate': 'create',
      'click @ui.manualRuleCreationReactivate': 'reactivate'
    });
  },

  onRender: function () {
    ModalFormView.prototype.onRender.apply(this, arguments);
    this.keyModifiedByUser = false;
    this.ui.manualRuleCreationReactivate.addClass('hidden');
  },

  generateKey: function () {
    if (!this.keyModifiedByUser && this.ui.manualRuleCreationKey) {
      var generatedKey = latinize(this.ui.manualRuleCreationName.val()).replace(/[^A-Za-z0-9]/g, '_');
      this.ui.manualRuleCreationKey.val(generatedKey);
    }
  },

  flagKey: function () {
    this.keyModifiedByUser = true;
  },

  create: function () {
    var action = (this.model && this.model.has('key')) ? 'update' : 'create',
        options = {
          name: this.ui.manualRuleCreationName.val(),
          markdown_description: this.ui.manualRuleCreationHtmlDescription.val()
        };
    if (action === 'update') {
      options.key = this.model.get('key');
    } else {
      options.manual_key = this.ui.manualRuleCreationKey.val();
      options.prevent_reactivation = true;
    }
    this.sendRequest(action, options);
  },

  reactivate: function () {
    var options = {
      name: this.existingRule.name,
      markdown_description: this.existingRule.mdDesc,
      manual_key: this.ui.manualRuleCreationKey.val(),
      prevent_reactivation: false
    };
    this.sendRequest('create', options);
  },

  sendRequest: function (action, options) {
    var that = this,
        url = baseUrl + '/api/rules/' + action;
    return $.ajax({
      url: url,
      type: 'POST',
      data: options,
      statusCode: {
        // do not show global error
        400: null
      }
    }).done(function (r) {
      if (typeof r === 'string') {
        r = JSON.parse(r);
      }
      that.options.app.controller.showDetails(r.rule.key);
      that.destroy();
    }).fail(function (jqXHR) {
      if (jqXHR.status === 409) {
        that.existingRule = jqXHR.responseJSON.rule;
        that.showErrors([], [{ msg: translate('coding_rules.reactivate.help') }]);
        that.ui.manualRuleCreationCreate.addClass('hidden');
        that.ui.manualRuleCreationReactivate.removeClass('hidden');
      } else {
        that.showErrors(jqXHR.responseJSON.errors, jqXHR.responseJSON.warnings);
      }
    });
  },

  serializeData: function () {
    return _.extend(ModalFormView.prototype.serializeData.apply(this, arguments), {
      change: this.model && this.model.has('key')
    });
  }
});
