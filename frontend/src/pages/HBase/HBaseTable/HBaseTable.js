import React from 'react';
import { connect } from 'dva';
import {
  Button,
  Row,
  Col,
  Spin,
  Icon,
  Input,
  Radio,
  Select,
  Modal,
  Popconfirm,
  message,
  DatePicker,
} from 'antd';
import GridContent from '@/components/PageHeaderWrapper/GridContent';
import ResizableTable from '@/mycomponents/ResizableTable';
import ListDrawer from '@/mycomponents/ListDrawer';
import styles from './HBaseTable.less';
import InsertDialog from './InsertDialog';
import Highlighter from 'react-highlight-words';
import moment from 'moment';
import { splitLongText } from '@/utils/utils';

const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

@connect(({ hbaseTable, loading }) => ({
  hbaseTable,
  loading,
}))
class HBaseTable extends React.Component {
  state = {
    currentTableName: '',
    drawerVisible: false,
    filterTable: '',
    showMode: 1,
    lastRowKey: '',
    pageSize: 10,
    insertDialogVisible: false,
    columns: [],
    deleteRowKey: new Set(),
    deleteColId: new Set(),
    timeMode: true,
    rowkeyMode: true,
    rotate: 0,
    rotateRowkey: 0,
    editColIndex: -1,
    recoverIndex: new Set(),
    onFirstPage: true,
    startTime: 0,
    endTime: 0,
  };

  componentDidMount() {
    const { match } = this.props;
    const { tableName } = match.params;
    if (tableName) {
      this.listTableName(() => this.findFirstPage(tableName));
    } else {
      this.listTableName(this.findFirstPage);
    }
  }

  findFirstPage = tableName => {
    this.setState(
      {
        lastRowKey: '',
      },
      () => this.findByPage(tableName, false)
    );
  };

  findByPage = (tableName, removeFirst) => {
    const { dispatch } = this.props;
    const { lastRowKey, pageSize, startTime, endTime } = this.state;
    dispatch({
      type: 'hbaseTable/findByPage',
      payload: {
        tableName,
        pageSize,
        rowKey: lastRowKey,
        removeFirst: removeFirst === undefined ? true : removeFirst,
        startTime,
        endTime,
      },
      callback: (lastRowKey, familyAndQualifiers) => {
        const newState = {
          currentTableName: tableName,
          onFirstPage: this.state.lastRowKey === '',
        };
        if (lastRowKey !== undefined) {
          newState.lastRowKey = lastRowKey;
        }
        this.setState(newState);
        this.generaterColumns(familyAndQualifiers);
      },
    });
  };

  deleteRow = rowKey => {
    const { currentTableName, deleteRowKey } = this.state;
    const { dispatch } = this.props;
    this.setState({
      deleteRowKey: deleteRowKey.add(rowKey),
    });
    dispatch({
      type: 'hbaseTable/deleteRow',
      payload: {
        tableName: currentTableName,
        rowKey,
      },
      callback: () => {
        deleteRowKey.delete(rowKey);
        this.setState({
          deleteRowKey,
        });
      },
    });
  };

  deleteCol = record => {
    const { currentTableName, deleteColId } = this.state;
    const { dispatch } = this.props;
    const colId = this.getColId(record);
    this.setState({
      deleteColId: deleteColId.add(colId),
    });
    dispatch({
      type: 'hbaseTable/deleteCol',
      payload: {
        tableName: currentTableName,
        ...record,
      },
      callback: () => {
        deleteColId.delete(colId);
        this.setState({
          deleteColId,
        });
      },
    });
  };

  generaterColumns = familyAndQualifiers => {
    const columns = [
      {
        title: () => (
          <div>
            <span>rowKey</span>
            <Icon
              type="swap"
              onClick={this.changeRowkeyMode}
              style={{ color: '#1890FF', marginLeft: 8 }}
              className={styles.transitionIcon}
              rotate={this.state.rotateRowkey}
            />
          </div>
        ),
        dataIndex: 'rowKey',
        width: 120,
        render: text => (this.state.rowkeyMode ? text : 'undo'),
      },
    ];
    for (let i = 0; i < familyAndQualifiers.length; i++) {
      const faq = familyAndQualifiers[i];
      const column = { title: faq.family, children: [] };
      const quas = faq.qualifiers;
      for (let j = 0; j < quas.length; j++) {
        const qua = quas[j];
        column.children.push({
          title: qua,
          dataIndex: `${faq.family}.${qua}`,
          width: 120,
          render: text => splitLongText(text),
        });
      }
      columns.push(column);
    }
    columns.push({
      title: 'Action',
      key: 'action',
      fixed: 'right',
      render: (text, record) => {
        const { deleteRowKey } = this.state;
        const deleting = deleteRowKey.has(record.rowKey);
        const disabled = record.deleted || deleting;
        const popParams = {};
        if (disabled) {
          popParams.visible = false;
        }
        return (
          <Popconfirm
            title="Are you sure delete this row?"
            onConfirm={() => this.deleteRow(record.rowKey)}
            okText="Yes"
            cancelText="No"
            disabled={disabled}
            {...popParams}
          >
            <Button
              style={{ cursor: 'pointer' }}
              type="danger"
              size="small"
              disabled={disabled}
              icon={deleting ? 'loading' : record.deleted ? 'close-circle' : 'delete'}
            >
              {record.deleted ? 'Deleted' : 'Delete'}
            </Button>
          </Popconfirm>
        );
      },
    });
    this.setState({
      columns,
    });
  };

  findNextPage = () => {
    this.findByPage(this.state.currentTableName, true);
  };

  listTableName = callback => {
    const { dispatch } = this.props;
    dispatch({
      type: 'hbaseTable/listTableName',
      callback,
    });
  };

  showDrawer = () => {
    this.setState({
      drawerVisible: true,
    });
  };

  onClose = () => {
    this.setState({
      drawerVisible: false,
    });
  };

  changePageSize = value => {
    const { currentTableName } = this.state;
    this.setState(
      {
        pageSize: value,
      },
      () => this.findFirstPage(currentTableName)
    );
  };

  changeInsertDialogVisible = visible => {
    this.setState({
      insertDialogVisible: visible,
    });
  };

  insertOver = rowKey => {
    this.changeInsertDialogVisible(false);
    const { currentTableName } = this.state;
    this.setState(
      {
        lastRowKey: rowKey,
      },
      () => this.findByPage(currentTableName, false)
    );
  };

  findWithStartRowKey = value => {
    if (!value) {
      message.warn('rowKey cannot be empty');
      return;
    }
    const { currentTableName } = this.state;
    this.setState(
      {
        lastRowKey: value,
      },
      () => this.findByPage(currentTableName, false)
    );
  };

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm)}
          icon="search"
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
        </Button>
        <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
          Reset
        </Button>
      </div>
    ),
    filterIcon: filtered => (
      <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: (text, record) => (
      <Highlighter
        highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
        searchWords={[this.state.searchText]}
        autoEscape
        textToHighlight={text.toString()}
      />
    ),
  });

  handleSearch = (selectedKeys, confirm) => {
    confirm();
    this.setState({ searchText: selectedKeys[0] });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  changeTimeMode = () => {
    const { timeMode, rotate } = this.state;
    this.setState({
      timeMode: !timeMode,
      rotate: rotate === 0 ? 180 : 0,
    });
  };

  changeRowkeyMode = () => {
    const { rowkeyMode, rotateRowkey } = this.state;
    this.setState({
      rowkeyMode: !rowkeyMode,
      rotate: rotateRowkey === 0 ? 180 : 0,
    });
  };

  changeEditIndex = index => {
    if (this.cancleEditTimeout) {
      clearTimeout(this.cancleEditTimeout);
    }
    setTimeout(() => {
      const ref = this[`search_${index}`];
      if (ref) {
        this[`search_${index}`].focus();
      }
    }, 100);
    this.setState({
      editColIndex: index,
    });
  };

  updateValue = (record, value, index) => {
    if (this.cancleEditTimeout) {
      clearTimeout(this.cancleEditTimeout);
    }
    this.insertRow(record, value, rowKey => {
      this.setState({
        editColIndex: -1,
      });
      this.insertOver(rowKey);
    });
  };

  onBlurValueInput = () => {
    this.cancleEditTimeout = setTimeout(() => {
      this.setState({
        editColIndex: -1,
      });
    }, 200);
  };

  insertRow = (record, value, callback) => {
    const { rowKey, family, qualifier } = record;
    const { dispatch } = this.props;
    const { currentTableName } = this.state;
    dispatch({
      type: 'hbaseTable/insertRow',
      payload: {
        tableName: currentTableName,
        rowKey,
        beans: [{ family, qualifier, value }],
      },
      callback: () => callback(rowKey),
    });
  };

  recoverRow = (record, callback) => {
    const { rowKey, family, qualifier, value } = record;
    const { dispatch } = this.props;
    const { currentTableName } = this.state;
    dispatch({
      type: 'hbaseTable/recoverRow',
      payload: {
        tableName: currentTableName,
        rowKey,
        beans: [{ family, qualifier, value }],
      },
      callback,
    });
  };

  pressRecover = (record, index) => {
    const { recoverIndex } = this.state;
    this.setState({
      recoverIndex: recoverIndex.add(index),
    });
    this.recoverRow(record, () => {
      recoverIndex.delete(index);
      this.setState({
        recoverIndex,
      });
    });
  };

  columnsCol = [
    {
      title: 'RowKey',
      dataIndex: 'rowKey',
      width: 200,
      ...this.getColumnSearchProps('rowKey'),
    },
    {
      title: 'Family',
      dataIndex: 'family',
      width: 200,
    },
    {
      title: 'Qualifier',
      dataIndex: 'qualifier',
      width: 200,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: 200,
      render: (text, record, index) => {
        if (this.state.editColIndex === index) {
          return (
            <Spin spinning={!!this.props.loading.effects['hbaseTable/insertRow']}>
              <Search
                defaultValue={text}
                enterButton="Save"
                size="small"
                onSearch={value => this.updateValue(record, value)}
                onBlur={this.onBlurValueInput}
                ref={search => {
                  if (search) {
                    this[`search_${index}`] = search;
                  }
                }}
                id={`search_${index}`}
              />
            </Spin>
          );
        } else {
          const disabled = record.deleted || this.state.deleteColId.has(this.getColId(record));
          return (
            <div
              onClick={() => {
                disabled ? message.warn('the column is deleted') : this.changeEditIndex(index);
              }}
              style={{ cursor: disabled ? 'not-allowed' : 'edit' }}
            >
              {splitLongText(text)}
            </div>
          );
        }
      },
    },
    {
      title: () => (
        <div>
          <span>Timestamp</span>
          <Icon
            type="swap"
            onClick={this.changeTimeMode}
            style={{ color: '#1890FF', marginLeft: 8 }}
            className={styles.transitionIcon}
            rotate={this.state.rotate}
          />
        </div>
      ),
      dataIndex: 'timestamp',
      width: 200,
      // render: text => {

      //   if (this.state.timeMode) {
      //     if (text.length === 10) {
      //       return moment.unix(text).format("YYYY-MM-DD HH:mm:ss.SSS")
      //     }
      //     if (text.length === 13) {
      //       return moment(text).format("YYYY-MM-DD HH:mm:ss.SSS")
      //     }
      //   }
      //   return text;
      // },
      render: text =>
        this.state.timeMode
          ? (text + '').length === 10
            ? moment.unix(text).format('YYYY-MM-DD HH:mm:ss')
            : moment(text).format('YYYY-MM-DD HH:mm:ss.SSS')
          : text,
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      render: (text, record, index) => {
        const deleting = this.state.deleteColId.has(this.getColId(record));
        const disabled = record.deleted || deleting;
        const popParams = {};
        if (disabled) {
          popParams.visible = false;
        }
        const recovering = this.state.recoverIndex.has(index);
        return (
          <div>
            {!record.deleted && (
              <Button
                style={{ cursor: disabled ? 'not-allowed' : 'pointer', marginRight: 8 }}
                type="primary"
                size="small"
                disabled={disabled}
                icon={'edit'}
                onClick={() => this.changeEditIndex(index)}
              >
                {'Edit'}
              </Button>
            )}
            {record.deleted && (
              <Button
                style={{ cursor: 'pointer', marginRight: 8 }}
                type="primary"
                size="small"
                icon={recovering ? 'loading' : 'redo'}
                onClick={() => {
                  this.pressRecover(record, index);
                }}
                disabled={recovering}
              >
                {'Recover'}
              </Button>
            )}
            {!record.deleted && (
              <Popconfirm
                title="Are you sure delete this row?"
                onConfirm={() => this.deleteCol(record)}
                okText="Yes"
                cancelText="No"
                disabled={disabled}
                {...popParams}
              >
                <Button
                  style={{ cursor: 'pointer' }}
                  type="danger"
                  size="small"
                  disabled={disabled}
                  icon={deleting ? 'loading' : record.deleted ? 'close-circle' : 'delete'}
                >
                  {record.deleted ? 'Deleted' : 'Delete'}
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  getColId = record =>
    `${record.rowKey}.${record.family}.${record.qualifier}.${record.value}.${record.timestamp}`;

  getColNum = columns => {
    let num = 0;
    columns.forEach(item => {
      if (item.children) {
        num += item.children.length;
      } else {
        num += 1;
      }
    });
    return num;
  };

  onChangeTime = dates => {
    this.setState({
      startTime: dates[0] ? dates[0].unix() : 0,
      endTime: dates[1] ? dates[1].unix() : 0,
    });
  };

  onOkTime = dates => {
    const { currentTableName } = this.state;
    this.setState(
      {
        startTime: dates[0].unix(),
        endTime: dates[1].unix(),
      },
      () => this.findFirstPage(currentTableName)
    );
  };

  render() {
    const { hbaseTable, loading } = this.props;
    const { dataSource, dataSourceCol, tableNames } = hbaseTable;
    const {
      columns,
      currentTableName,
      drawerVisible,
      pageSize,
      showMode,
      insertDialogVisible,
      onFirstPage,
      editColIndex,
    } = this.state;

    return (
      <GridContent>
        <Row gutter={24} style={{ marginBottom: 12 }}>
          <Col span={18}>
            {currentTableName && (
              <div>
                <Button
                  type="primary"
                  onClick={() => this.findFirstPage(currentTableName)}
                  style={{ marginRight: 12 }}
                  icon="reload"
                >
                  {currentTableName}
                </Button>
                <Button
                  type="primary"
                  onClick={() => this.changeInsertDialogVisible(true)}
                  style={{ marginRight: 12 }}
                >
                  Insert Row
                </Button>
                <Search
                  placeholder="input start rowKey"
                  enterButton="Go!"
                  onSearch={this.findWithStartRowKey}
                  style={{ display: 'inline-block', width: 220, marginRight: 12 }}
                />
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={['Start Time', 'End Time']}
                  onChange={this.onChangeTime}
                  onOk={this.onOkTime}
                />
              </div>
            )}
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Radio.Group
              value={showMode}
              onChange={e => this.setState({ showMode: e.target.value })}
              buttonStyle="solid"
              style={{ marginRight: 12 }}
            >
              <Radio.Button value={1}>ROW</Radio.Button>
              <Radio.Button value={2}>COL</Radio.Button>
            </Radio.Group>
            <Button type="primary" icon="left" onClick={this.showDrawer}>
              ALL TABLE
            </Button>
          </Col>
        </Row>
        {showMode === 1 ? (
          <ResizableTable
            columns={columns}
            dataSource={dataSource}
            rowKey="rowKey"
            bordered
            size="middle"
            loading={
              (!currentTableName && loading.effects['hbaseTable/listTableName']) ||
              loading.effects['hbaseTable/findByPage']
            }
            pagination={false}
            scroll={{ x: this.getColNum(columns) > 5 ? 'max-content' : false }}
          />
        ) : (
          <ResizableTable
            columns={this.columnsCol}
            dataSource={dataSourceCol}
            rowKey={this.getColId}
            bordered
            size="middle"
            loading={
              (!currentTableName && loading.effects['hbaseTable/listTableName']) ||
              loading.effects['hbaseTable/findByPage']
            }
            pagination={{
              total: dataSourceCol.length,
              showSizeChanger: true,
              showQuickJumper: true,
              size: 'middle',
              showTotal: total => `Total ${total} columns`,
              pageSizeOptions: ['10', '30', '50'],
            }}
            editColIndex={editColIndex}
            scroll={{ x: this.getColNum(this.columnsCol) > 5 ? 'max-content' : false }}
          />
        )}
        <div style={{ width: '100%', textAlign: 'right', marginTop: 12 }}>
          <Select style={{ width: 100 }} value={pageSize} onChange={this.changePageSize}>
            <Option value={10}>10 rows</Option>
            <Option value={30}>30 rows</Option>
            <Option value={50}>50 rows</Option>
          </Select>
          {!onFirstPage && (
            <Button
              type="primary"
              style={{ marginLeft: 12 }}
              onClick={() => this.findFirstPage(currentTableName)}
            >
              FIRST
            </Button>
          )}
          {dataSource.length >= pageSize && (
            <Button type="primary" style={{ marginLeft: 12 }} onClick={this.findNextPage}>
              NEXT
            </Button>
          )}
        </div>
        <ListDrawer
          title="ALL TABLE"
          width={350}
          loading={!!loading.effects['hbaseTable/listTableName']}
          onReload={this.listTableName}
          visible={drawerVisible}
          onClose={this.onClose}
          dataSource={tableNames}
          selected={currentTableName}
          onSelect={this.findFirstPage}
        />
        <Modal
          // destroyOnClose={true}
          title={`Insert To ${currentTableName}`}
          visible={insertDialogVisible}
          onCancel={() => this.changeInsertDialogVisible(false)}
          footer={null}
        >
          <InsertDialog insertOver={this.insertOver} tableName={currentTableName} />
        </Modal>
      </GridContent>
    );
  }
}

export default HBaseTable;
