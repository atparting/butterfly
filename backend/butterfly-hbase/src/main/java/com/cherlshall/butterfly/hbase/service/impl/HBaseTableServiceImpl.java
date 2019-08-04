package com.cherlshall.butterfly.hbase.service.impl;

import com.cherlshall.butterfly.common.exception.ButterflyException;
import com.cherlshall.butterfly.hbase.dao.HBaseTableDao;
import com.cherlshall.butterfly.hbase.entity.HBaseBean;
import com.cherlshall.butterfly.hbase.entity.HBaseTable;
import com.cherlshall.butterfly.hbase.service.HBaseTableService;
import com.cherlshall.butterfly.hbase.util.HBaseCheck;
import org.apache.hadoop.hbase.client.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HBaseTableServiceImpl implements HBaseTableService {

    @Autowired
    private HBaseTableDao dao;
    @Autowired
    private HBaseCheck check;

    @Override
    public HBaseTable findByPage(String tableName, String rowKey, int pageSize, boolean removeFirst) {
        check.checkUsable(tableName);
        if (rowKey == null || rowKey.isEmpty()) {
            return new HBaseTable(dao.findByPage(tableName, pageSize));
        }
        if (removeFirst) {
            pageSize++;
        }
        List<Result> results = dao.findByRowKeyAndPage(tableName, rowKey, pageSize);
        if (removeFirst && results.size() > 0) {
            results.remove(0);
        }
        return new HBaseTable(results);
    }

    @Override
    public HBaseTable findByRowKey(String tableName, String rowKey) {
        check.checkUsable(tableName);
        return new HBaseTable(dao.findByRowKey(tableName, rowKey));
    }

    @Override
    public int insertRow(String tableName, String rowKey, List<HBaseBean> beans) {
        check.checkUsable(tableName);
        int insertSuccess = 0;
        for (HBaseBean bean : beans) {
            try {
                insertSuccess += dao.insert(tableName, rowKey,
                        bean.getFamily(), bean.getQualifier(), bean.getValue());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return insertSuccess;
    }

    @Override
    public void deleteRow(String tableName, String rowKey) {
        check.checkExist(tableName);
        int delete = dao.delete(tableName, rowKey);
        if (delete <= 0) {
            throw new ButterflyException();
        }
    }

    @Override
    public void deleteCol(String tableName, String rowName, String familyName, String qualifier) {
        check.checkExist(tableName);
        int delete = dao.delete(tableName, rowName, familyName, qualifier);
        if (delete <= 0) {
            throw new ButterflyException("delete failure, maybe resource does not exist");
        }
    }


}
