package com.cherlshall.butterfly.common.validate.annotation;

import com.cherlshall.butterfly.common.validate.parser.AmongParser;
import com.cherlshall.butterfly.common.validate.parser.RuleParser;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 属于几个选项之中
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Among {

    /**
     * 可选项
     */
    String[] value();

    /**
     * 字段校验失败时的msg
     */
    String message() default "{name}可选择值为{value}";

    /**
     * 仅匹配到时进行验证
     */
    String[] where() default {};

    /**
     * 指定规则解析器
     */
    Class<? extends RuleParser>[] parser() default AmongParser.class;
}
