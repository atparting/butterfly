package com.cherlshall.butterfly.m2.controller;

import com.cherlshall.butterfly.common.vo.R;
import com.cherlshall.butterfly.m2.entity.po.Field;
import com.cherlshall.butterfly.m2.entity.vo.FieldVO;
import com.cherlshall.butterfly.m2.service.FieldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * @author hu.tengfei
 * @date 2020/1/7
 */
@RestController
@RequestMapping("m2/field")
public class FieldController {

    @Autowired
    private FieldService service;

    @PostMapping()
    public R insert(@RequestBody Field field) {
        field.setActive(1);
        service.insert(field);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R delete(@PathVariable(name = "id") Integer id) {
        service.delete(id);
        return R.ok();
    }

    @PutMapping()
    public R update(@RequestBody FieldVO fieldVO) {
        service.update(fieldVO);
        return R.ok();
    }

    @GetMapping()
    public R listByPage(FieldVO fieldVO) {
        return R.ok(service.listByPage(fieldVO));
    }

    @PutMapping("active/{active}/{id}")
    public R changeActive(@PathVariable("active") Integer active, @PathVariable("id") Integer id) {
        service.changeActive(active, id);
        return R.ok();
    }
}
