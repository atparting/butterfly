import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Input, Icon, Button, Select, InputNumber, TreeSelect } from 'antd';

const { Option } = Select;

@connect(({ m2Field, loading }) => ({
  m2Field,
  loading,
}))
class CreateDialog extends PureComponent {
  state = {
    tlvTreeData: [],
    extTreeData: [],
  };

  componentDidMount() {
    this.listProtocolNames();
  }

  listProtocolNames = () => {
    const { dispatch } = this.props;
    dispatch({
      type: 'm2Field/listProtocolName',
      payload: {
        category: 1,
      },
      callback: protocolNames => {
        const tlvTreeData = [];
        const extTreeData = [];
        protocolNames.forEach(item => {
          tlvTreeData.push({ id: item.id, pId: 0, value: item.id.toString(), title: item.enName });
          extTreeData.push({
            id: item.id,
            pId: 0,
            value: item.id.toString(),
            title: item.enName,
            selectable: false,
          });
        });
        this.setState({
          tlvTreeData,
          extTreeData,
        });
      },
    });
  };

  onLoadData = treeNode => {
    const { dispatch, form } = this.props;
    const { tlvTreeData, extTreeData } = this.state;
    const valueType = form.getFieldValue('valueType');

    return new Promise(resolve => {
      const { id } = treeNode.props;
      const category = valueType === 'tlv' ? 2 : 3;
      dispatch({
        type: 'm2Field/listChildProtocolName',
        payload: {
          category,
          protocolId: id,
        },
        callback: childNames => {
          const childTreeData = [];
          childNames.forEach(item => {
            childTreeData.push({
              id: item.id,
              pId: id,
              value: item.id.toString(),
              title: item.enName,
              isLeaf: true,
            });
          });
          if (category === 2) {
            this.setState({
              tlvTreeData: tlvTreeData.concat(childTreeData),
            });
          } else {
            this.setState({
              extTreeData: extTreeData.concat(childTreeData),
            });
          }
          resolve();
        },
      });
    });
  };

  submit = values => {
    const { dispatch, createOver, protocolId, editMode, record } = this.props;
    dispatch({
      type: editMode ? 'm2Field/update' : 'm2Field/create',
      payload: {
        ...record,
        ...values,
        protocolId,
      },
      callback: createOver,
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    const { form } = this.props;
    form.validateFields((err, values) => {
      const valuesSubmit = { ...values };
      if (values.valueType === 'tlv') {
        valuesSubmit.link = values.linkTlv;
      } else if (values.valueType === 'extractor') {
        valuesSubmit.link = values.linkExt;
      }
      if (values.type.indexOf('0x') === 0 || values.type.indexOf('0X') === 0) {
        valuesSubmit.type = parseInt(values.type, 16);
      }
      if (!err) {
        this.submit(valuesSubmit);
      }
    });
  };

  hasSize = valueType => {
    return valueType !== 'tlv' && valueType !== 'extractor' && valueType !== 'string';
  };

  render() {
    const { loading, form, record, editMode } = this.props;
    const { tlvTreeData, extTreeData } = this.state;
    const { getFieldDecorator } = form;
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
      },
    };
    const formItemLayoutWithOutLabel = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 18, offset: 6 },
      },
    };

    const valueType = ['string', 'int', 'long', 'byte', 'tlv', 'extractor'];

    const selectValueType = form.getFieldValue('valueType');

    return (
      <Form onSubmit={this.handleSubmit}>
        <Form.Item {...formItemLayout} label="Value Type" required key="valueType">
          {getFieldDecorator('valueType', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.valueType || 'string',
            rules: [
              {
                required: true,
                whitespace: true,
                message: 'Please input value type.',
              },
            ],
          })(
            <Select style={{ width: '80%' }} showSearch placeholder="Select name of protocol">
              {valueType.map(t => (
                <Option value={t} key={t}>
                  {t}
                </Option>
              ))}
            </Select>
          )}
        </Form.Item>
        {selectValueType !== 'extractor' && (
          <Form.Item {...formItemLayout} label="Type" required key="type">
            {getFieldDecorator('type', {
              validateTrigger: ['onChange', 'onBlur'],
              initialValue: record.type ? record.type.toString() : '',
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: 'Please input field type.',
                },
              ],
            })(<Input placeholder="field type" style={{ width: '80%', marginRight: 8 }} />)}
          </Form.Item>
        )}

        <Form.Item {...formItemLayout} label="Name(CN)" required key="cnName">
          {getFieldDecorator('cnName', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.cnName,
            rules: [
              {
                required: true,
                whitespace: true,
                message: 'Please input field Name(CN).',
              },
            ],
          })(<Input placeholder="field name(CN)" style={{ width: '80%' }} />)}
        </Form.Item>

        <Form.Item {...formItemLayout} label="Name(EN)" required key="enName">
          {getFieldDecorator('enName', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.enName,
            rules: [
              {
                required: true,
                whitespace: true,
                message: 'Please input field Name(EN).',
              },
            ],
          })(<Input placeholder="field name(EN)" style={{ width: '80%' }} />)}
        </Form.Item>

        {selectValueType === 'tlv' && (
          <Form.Item {...formItemLayout} label="Link" required key="linkTlv">
            {getFieldDecorator('linkTlv', {
              validateTrigger: ['onChange', 'onBlur'],
              initialValue: record.link ? record.link.toString() : '',
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: 'Please input field link.',
                },
              ],
            })(
              <TreeSelect
                treeDataSimpleMode
                style={{ width: '80%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="field link"
                loadData={this.onLoadData}
                treeData={tlvTreeData}
              />
            )}
          </Form.Item>
        )}

        {selectValueType === 'extractor' && (
          <Form.Item {...formItemLayout} label="Link" required key="linkExt">
            {getFieldDecorator('linkExt', {
              validateTrigger: ['onChange', 'onBlur'],
              initialValue: record.link,
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: 'Please input field link.',
                },
              ],
            })(
              <TreeSelect
                treeDataSimpleMode
                style={{ width: '80%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="field link"
                loadData={this.onLoadData}
                treeData={extTreeData}
              />
            )}
          </Form.Item>
        )}

        {this.hasSize(selectValueType) && (
          <Form.Item {...formItemLayout} label="Size" required key="size">
            {getFieldDecorator('size', {
              validateTrigger: ['onChange', 'onBlur'],
              initialValue: record.size,
              rules: [
                {
                  required: true,
                  whitespace: true,
                  message: 'Please input field size.',
                },
              ],
            })(<InputNumber placeholder="field size" style={{ width: '80%' }} />)}
          </Form.Item>
        )}

        <Form.Item {...formItemLayout} label="Wireshark Name" key="wiresharkName">
          {getFieldDecorator('wiresharkName', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.wiresharkName,
          })(<Input placeholder="wireshark name" style={{ width: '80%' }} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Wireshark Filter Syntax" key="wiresharkFilterSyntax">
          {getFieldDecorator('wiresharkFilterSyntax', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.wiresharkFilterSyntax,
          })(<Input placeholder="wireshark filter syntax" style={{ width: '80%' }} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Example" key="example">
          {getFieldDecorator('example', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.example,
          })(<Input placeholder="example" style={{ width: '80%' }} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Remark" key="remark">
          {getFieldDecorator('remark', {
            validateTrigger: ['onChange', 'onBlur'],
            initialValue: record.remark,
          })(<Input placeholder="remark" style={{ width: '80%' }} />)}
        </Form.Item>

        <Form.Item {...formItemLayoutWithOutLabel}>
          <Button
            type="primary"
            disabled={loading.effects[editMode ? 'm2Protocol/update' : 'm2Protocol/create']}
            htmlType="submit"
            style={{ width: '80%' }}
          >
            {loading.effects[editMode ? 'm2Protocol/update' : 'm2Protocol/create'] ? (
              <Icon type="loading" />
            ) : editMode ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default Form.create({ name: 'dynamic_form_item' })(CreateDialog);
