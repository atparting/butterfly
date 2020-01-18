package com.cherlshall.butterfly.m2.service.impl;

import com.cherlshall.butterfly.common.exception.ButterflyException;
import com.cherlshall.butterfly.common.vo.PageData;
import com.cherlshall.butterfly.m2.dao.ProtocolDao;
import com.cherlshall.butterfly.m2.entity.dto.ProtocolName;
import com.cherlshall.butterfly.m2.entity.po.Protocol;
import com.cherlshall.butterfly.m2.entity.vo.ProtocolVO;
import com.cherlshall.butterfly.m2.service.ProtocolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author hu.tengfei
 * @date 2020/1/7
 */
@Service
public class ProtocolServiceImpl implements ProtocolService {

    @Autowired
    private ProtocolDao dao;

    @Override
    public void insert(Protocol protocol) {
        ProtocolVO check = new ProtocolVO();
        check.setType(protocol.getType());
        if (dao.count(check) != 0) {
            throw new ButterflyException("Type is already exists");
        }
        check.setType(null);
        check.setEnName(protocol.getEnName());
        if (dao.count(check) != 0) {
            throw new ButterflyException("Name(EN) is already exists");
        }
        if (dao.insert(protocol) == 0) {
            throw new ButterflyException("插入失败");
        }
    }

    @Override
    public void delete(Integer id) {
        if (dao.delete(id) == 0) {
            throw new ButterflyException("删除失败");
        }
    }

    @Override
    public void update(ProtocolVO protocolVO) {
        Protocol beforeUpdate = dao.findById(protocolVO.getId());
        ProtocolVO check = new ProtocolVO();
        check.setType(protocolVO.getType());
        if (!protocolVO.getType().equals(beforeUpdate.getType()) && dao.count(check) != 0) {
            throw new ButterflyException("Type is already exists");
        }
        check.setType(null);
        check.setEnName(protocolVO.getEnName());
        if (!protocolVO.getEnName().equals(beforeUpdate.getEnName()) && dao.count(check) != 0) {
            throw new ButterflyException("Name(EN) is already exists");
        }
        if (dao.update(protocolVO) == 0) {
            throw new ButterflyException("更新失败");
        }
    }

    @Override
    public PageData<Protocol> listByPage(ProtocolVO protocolVO) {
        if (protocolVO.getCategory() == 2 || protocolVO.getCategory() == 3) {
            return new PageData<>(dao.listWithProtocolNameByPage(protocolVO), dao.count(protocolVO));
        }
        return new PageData<>(dao.listByPage(protocolVO), dao.count(protocolVO));
    }

    @Override
    public List<ProtocolName> listProtocolName(Integer category) {
        return dao.namesByCategory(category);
    }

    @Override
    public List<ProtocolName> listProtocolName(Integer category, Integer protocolId) {
        return dao.namesByCategoryAndProtocolId(category, protocolId);
    }
}
