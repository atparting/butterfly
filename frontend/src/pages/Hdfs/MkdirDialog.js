import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Form, Input, Icon, Button } from 'antd';
import GridContent from '@/components/PageHeaderWrapper/GridContent';

@connect(({ hdfs, loading }) => ({
  hdfs,
  loading,
}))
class MkdirDialog extends PureComponent {

  create = (name) => {
    const { path, onOver } = this.props;
    const { dispatch } = this.props;
    dispatch({
      type: 'hdfs/mkdirs',
      payload: {
        path: `${path}${path === '/' ? '' : '/'}${name}`,
      },
      callback: () => onOver(),
    })
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { name } = values;
        this.create(name);
      }
    });
  };

  render() {
    const { loading, path } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    const formItemLayoutSubmit = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 6, offset: 18 },
      },
    };
    const formItemLayoutWithOutLabel = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 24, offset: 0 },
      },
    };
    return (
      <Form onSubmit={this.handleSubmit}>
        <Form.Item
          {...formItemLayoutWithOutLabel}
          required={true}
        >
          {getFieldDecorator('name', {
            validateTrigger: ['onChange', 'onBlur'],
            rules: [
              {
                required: true,
                whitespace: true,
                message: "Please input dir name.",
              },
            ],
          })(<Input addonBefore={path} placeholder="dir name" />)}
        </Form.Item>
        <Form.Item {...formItemLayoutSubmit}>
          <Button type="primary" disabled={loading.effects['hdfs/mkdirs']} htmlType="submit" style={{ width: '100%' }}>
            {loading.effects['hdfs/mkdirs'] ? <Icon type="loading" /> : "Create"}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default Form.create({ name: 'hdfs_mkdirs_dialog' })(MkdirDialog);
