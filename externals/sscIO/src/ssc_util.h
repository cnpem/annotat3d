#ifndef MB_UTIL_H
#define MB_UTIL_H

#include <string>
#include <locale>
#include <iostream>
#include <cassert>
#include <math.h>
#include "../include/rapidjson/document.h"

int ssc_json_value_is_float(const std::string &member, const rapidjson::Document& document);
int ssc_json_value_is_int(const std::string &member, const rapidjson::Document& document);
int ssc_json_value_is_string(const std::string &member, const rapidjson::Document& document);
int ssc_json_has_member(const std::string &member, const rapidjson::Document& document);


/* Error */
enum check_type {equal, not_equal, gt_equal};
void print_err(std::string function_name, std::string message);
int check_null(void * result, std::string function_name, std::string message);
int check_err(int result, std::string function_name, std::string message, int check_value = 0, check_type type = check_type::equal);


extern "C" {

void rv_get_local_ip_to_reach_destination(const char *remote_host, char* buffer, size_t buflen);
char* rv_get_local_ip_to_reach_destination2(const char *remote_host);

std::string ssc_str_to_upper(const std::string &str);

void ssc_free(void *ptr);

}

#endif