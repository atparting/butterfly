package com.cherlshall.butterfly.sql.driver;

import com.cherlshall.butterfly.sql.annotation.Invisible;
import com.cherlshall.butterfly.sql.annotation.UpdateSet;
import com.cherlshall.butterfly.sql.annotation.UpdateWhere;
import com.google.common.base.CaseFormat;
import org.apache.ibatis.mapping.SqlSource;
import org.apache.ibatis.scripting.xmltags.XMLLanguageDriver;
import org.apache.ibatis.session.Configuration;

import java.lang.reflect.Field;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommonUpdateLangDriver extends XMLLanguageDriver {

    private final Pattern inPattern = Pattern.compile("\\(#\\{(\\w+)}\\)");
    private boolean defaultUpdateSet = false;
    private boolean defaultNullEnable = false;

    @Override
    public SqlSource createSqlSource(Configuration configuration, String script, Class<?> parameterType) {
        UpdateSet updateSet = parameterType.getAnnotation(UpdateSet.class);
        if (updateSet != null) {
            defaultUpdateSet = true;
            defaultNullEnable = updateSet.nullEnable();
        }
        Matcher matcher = inPattern.matcher(script);
        StringBuilder scriptBuilder = new StringBuilder();
        if (matcher.find()) {
            StringBuilder setScriptBuilder = new StringBuilder();
            // 生成set部分sql
            setScriptBuilder.append("<set>");
            for (Field field : parameterType.getDeclaredFields()) {
                // 过滤不需要set的属性
                if (shouldSet(field)) {
                    UpdateSet annotation = field.getAnnotation(UpdateSet.class);
                    String tmp;
                    if ((annotation == null && defaultNullEnable) || (annotation != null && annotation.nullEnable())) {
                        tmp = "_column=#{_field},";
                    } else {
                        tmp = "<if test=\"_field != null\">_column=#{_field},</if>";
                    }
                    setScriptBuilder.append(tmp.replaceAll("_field", field.getName())
                            .replaceAll("_column", CaseFormat.LOWER_CAMEL
                                    .to(CaseFormat.LOWER_UNDERSCORE, field.getName())));
                }
            }
            setScriptBuilder.deleteCharAt(setScriptBuilder.lastIndexOf(","));
            setScriptBuilder.append("</set>");
            // 生成条件部分sql
            String whereScript = generateWhereScript(parameterType);
            scriptBuilder.append("<script>").append(matcher.replaceAll(setScriptBuilder.toString()))
                    .append(whereScript).append("</script>");

        }
        return super.createSqlSource(configuration, scriptBuilder.toString(), parameterType);
    }

    private boolean shouldSet(Field field) {
        if (field.isAnnotationPresent(Invisible.class)) {
            return false;
        }
        if (field.isAnnotationPresent(UpdateSet.class)) {
            return true;
        }
        if (field.isAnnotationPresent(UpdateWhere.class)) {
            return false;
        }
        return defaultUpdateSet;
    }

    // 根据实体类自动生成sql的动态where部分
    private String generateWhereScript(Class<?> parameterType) {
        StringBuilder whereScriptBuilder = new StringBuilder();
        whereScriptBuilder.append("<where>");
        for (Field field : parameterType.getDeclaredFields()) {
            // 排除被@Invisible注解的属性
            if (!field.isAnnotationPresent(Invisible.class) && field.isAnnotationPresent(UpdateWhere.class)) {
                CommonSelectLangDriver.handleWhereItem(whereScriptBuilder, field);
            }
        }
        whereScriptBuilder.append("</where>");
        return whereScriptBuilder.toString();
    }
}
