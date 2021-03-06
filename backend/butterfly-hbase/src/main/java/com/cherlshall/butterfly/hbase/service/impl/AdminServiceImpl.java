package com.cherlshall.butterfly.hbase.service.impl;

import com.cherlshall.butterfly.common.exception.ButterflyException;
import com.cherlshall.butterfly.hbase.dao.AdminDao;
import com.cherlshall.butterfly.hbase.entity.HTableDetail;
import com.cherlshall.butterfly.hbase.service.AdminService;
import com.cherlshall.butterfly.hbase.util.HBaseCheck;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Vector;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminDao dao;
    @Autowired
    private HBaseCheck check;

    @Override
    public void create(String tableName, String... families) {
        if (families.length == 0) {
            throw new ButterflyException("Table should have at least one column family");
        }
        check.checkNotExist(tableName);
        boolean create = dao.create(tableName, families);
        if (!create) {
            throw new ButterflyException();
        }
    }

    @Override
    public void delete(String tableName) {
        check.checkExist(tableName);
        boolean delete = dao.delete(tableName);
        if (!delete) {
            throw new ButterflyException("delete failure");
        }
    }

    @Override
    public String[] list() {
        return dao.list();
    }

    @Override
    public List<HTableDetail> detail() {
        List<HTableDetail> detail = dao.detail();
        if (detail == null) {
            throw new ButterflyException();
        }
        return detail;
    }

    @Override
    public void disable(String tableName) {
        check.checkExist(tableName);
        check.checkEnable(tableName);
        boolean disable = dao.disable(tableName);
        if (!disable) {
            throw new ButterflyException();
        }
    }

    @Override
    public void enable(String tableName) {
        check.checkExist(tableName);
        check.checkDisable(tableName);
        boolean enable = dao.enable(tableName);
        if (!enable) {
            throw new ButterflyException();
        }
    }

    @Override
    public List<String> listFamily(String tableName) {
        check.checkExist(tableName);
        return dao.listFamily(tableName);
    }

    @Override
    public int addFamily(String tableName, String... family) {
        check.checkExist(tableName);
        return dao.addFamily(tableName, family);
    }

    @Override
    public int deleteFamily(String tableName, String... family) {
        check.checkExist(tableName);
        return dao.deleteFamily(tableName, family);
    }

    @Override
    public List<String> truncate(List<String> tableNames) {
        List<String> failTableNames = new Vector<>();
        int threadNum = tableNames.size() > 16 ? 16 : tableNames.size();
        ExecutorService service = Executors.newFixedThreadPool(threadNum);
        CountDownLatch latch = new CountDownLatch(tableNames.size());
        for (String tableName : tableNames) {
            service.submit(() -> {
                if (!dao.isDisable(tableName)) {
                    dao.disable(tableName);
                }
                if (!dao.truncate(tableName)) {
                    failTableNames.add(tableName);
                }
                latch.countDown();
            });
        }
        try {
            latch.await();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return failTableNames;
    }
}
