package com.cherlshall.butterfly.module.elasticsearch.dao;

import java.util.List;
import java.util.Map;

public interface EsDocDao {

    int insert(String indexName, Map<String, Object> data);

    int insert(String indexName, List<Map<String, Object>> data);

    int delete(String indexName, String id);

    int update(String indexName, String id, Map<String, Object> data);

}
