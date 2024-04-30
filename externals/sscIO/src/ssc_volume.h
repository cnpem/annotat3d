#ifndef SSC_VOLUME_H
#define SSC_VOLUME_H

#include "ssc_util.h"
// #include <cuda_fp16.h>

/* Image header */
#define SSC_VOLUME_HEADER_SIZE 65536

typedef enum {
	ssc_null = 0,
	ssc_int8,
	ssc_uint8,
	ssc_int16,
	ssc_uint16,
	ssc_int32,
	ssc_uint32,
	ssc_int64,
	ssc_uint64,
	// ssc_float16,
	ssc_float32,
	ssc_float64,
	ssc_complex64,
	ssc_uint8_3,
	ssc_uint8_4,
	ssc_uint16_3,
	ssc_uint16_4,
	ssc_float32_2,
	ssc_float32_3,
	ssc_float32_4,
} dtype_t;


typedef struct ssc_volume{
	std::string imaging_type;
	int x_size;
	int y_size;
	int z_size;
	size_t nelems;
	size_t data_size;

	float pixel_x_size;
	float pixel_y_size;
	float pixel_z_size;
	dtype_t dtype;
	void * volume;

	// Shared memory information. Set when used.
	int shm_id; // Shared memory id (IMPORTANT: obtained after using shmget with a given key)
	void *shm_data; // Pointer to the beginning of shared memory, which may include header information
} ssc_volume;


/* Shared memory */  
int ssc_create_shm(int shm_key, size_t num, size_t size);
int ssc_get_shm(int shm_key);
void ssc_shm_info(int shmid);
void* ssc_attach_shm_pointer(int shm_id);
void ssc_detach_shm_pointer(void* pointer);
int ssc_destroy_shm(int shm_id);
size_t ssc_shm_size(int shm_id);
size_t ssc_calculate_shm_memory_size(size_t num, size_t size) ;
int ssc_send_shm(std::string name, std::string dtype_str, size_t x, size_t y, size_t z, int shm_key);

ssc_volume *ssc_create_empty_volume();

bool ssc_alloc_volume_data(
	ssc_volume *img, 
	int xsize, 
	int ysize, 
	int zsize, 
	float pixel_x_size, 
	float pixel_y_size, 
	float pixel_z_size, 
	dtype_t dtype, 
	const char* imaging_type,
	int shm_key,
	char *volume_array,
	bool encode_shm_header);

void ssc_destroy_volume(ssc_volume **img, bool free_data);

inline int ssc_string_to_volume_format(const std::string &dtype_str, dtype_t * dtype) {

	if(dtype_str.compare("uint8") == 0)
		*dtype = ssc_uint8;
	else if(dtype_str.compare("int8") == 0)
		*dtype = ssc_int8;
	else if(dtype_str.compare("uint16") == 0)
		*dtype = ssc_uint16;
	else if(dtype_str.compare("int16") == 0)
		*dtype = ssc_int16;
	else if(dtype_str.compare("uint32") == 0)
		*dtype = ssc_uint32;
	else if(dtype_str.compare("int32") == 0)
		*dtype = ssc_int32;
	else if(dtype_str.compare("uint64") == 0)
		*dtype = ssc_uint64;
	else if(dtype_str.compare("int64") == 0)
		*dtype = ssc_int64;
	// else if(dtype_str.compare("float16") == 0)
	// 	*dtype = ssc_float16;
	else if(dtype_str.compare("float32") == 0)
		*dtype = ssc_float32;
	else if(dtype_str.compare("float64") == 0)
		*dtype = ssc_float64;
	else if(dtype_str.compare("uint8_3") == 0 || dtype_str.compare("rgb") == 0)
		*dtype = ssc_uint8_3;
	else if(dtype_str.compare("uint8_4") == 0 || dtype_str.compare("rgba") == 0)
		*dtype = ssc_uint8_4;	
	else if(dtype_str.compare("uint16_3") == 0 || dtype_str.compare("rgb16") == 0)
		*dtype = ssc_uint16_3;
	else if(dtype_str.compare("uint16_4") == 0 || dtype_str.compare("rgba16") == 0)
		*dtype = ssc_uint16_4;	
	else if(dtype_str.compare("float32_2") == 0 || dtype_str.compare("complex64") == 0)
		*dtype = ssc_complex64;
	else if(dtype_str.compare("float32_3") == 0)
		*dtype = ssc_float32_3;	
	else if(dtype_str.compare("float32_4") == 0)
		*dtype = ssc_float32_4;	
	else{
		fprintf(stderr, "[ssc_string_to_volume_format] Member dtype \"%s\" unrecognized.\n", dtype_str.c_str());
		return -1;
	}
	
	return 1;
}

inline std::string ssc_volume_format_string(const dtype_t fmt) {
    switch (fmt)
    {
        case ssc_int8:     return "int8";
        case ssc_uint8:     return "uint8";
        case ssc_int16:    return "int16";
        case ssc_uint16:    return "uint16";
        case ssc_int32:    return "int32";
        case ssc_uint32:    return "uint32";
        case ssc_int64:    return "int64";
        case ssc_uint64:    return "uint64";
        case ssc_float32:   return "float32";
        case ssc_float64:  return "float64";
		case ssc_complex64: 	return "complex64";
		case ssc_uint8_3: return "uint8_3";
		case ssc_uint8_4: return "uint8_4";
		case ssc_uint16_3: return "uint16_3";
		case ssc_uint16_4: return "uint16_4";
		case ssc_float32_2: return "float32_2";
		case ssc_float32_3: return "float32_3";
		case ssc_float32_4: return "float32_4";
        default:
            return "unknown type";
    }
}

inline size_t ssc_volume_format_size(const dtype_t fmt)
{
    switch (fmt)
    {
        case ssc_int8:     return     sizeof(char);
        case ssc_uint8:     return     sizeof(unsigned char);
        case ssc_int16:    return     sizeof(short);
        case ssc_uint16:    return     sizeof(unsigned short);
        case ssc_int32:     return     sizeof(int);
        case ssc_uint32:    return     sizeof(unsigned int);
        case ssc_int64:     return     sizeof(long);
        case ssc_uint64:     return     sizeof(unsigned long);
		// case ssc_float16:	return	sizeof(__half);	
        case ssc_float32:   return     sizeof(float);
        case ssc_float64:  return     sizeof(double);
		case ssc_complex64:
        case ssc_float32_2:	return     2*sizeof(float);
        case ssc_uint8_3:	return     3*sizeof(unsigned char);
        case ssc_uint8_4:	return     4*sizeof(unsigned char);
        case ssc_uint16_3:	return     3*sizeof(unsigned short);
        case ssc_uint16_4:	return     4*sizeof(unsigned short);
        case ssc_float32_3:	return     3*sizeof(float);
        case ssc_float32_4:	return     4*sizeof(float);
        default:
            return ssc_null;
    }
}

void ssc_print_volume(ssc_volume *img);

bool ssc_decode_volume_header_json(std::string json, ssc_volume * volume);

bool ssc_decode_volume_header(void *data, ssc_volume * img);
bool ssc_encode_volume_header(ssc_volume *img, char fileheader[SSC_VOLUME_HEADER_SIZE]);
bool ssc_encode_volume_header_raw(
	int x_size, 
	int y_size, 
	int z_size, 
	float pixel_x_size, 
	float pixel_y_size, 
	float pixel_z_size, 
	std::string imaging_type, 
	dtype_t dtype, 
	int shm_key,
	char fileheader[SSC_VOLUME_HEADER_SIZE]);

ssc_volume* ssc_decode_shared_volume(int shm_key);
bool ssc_decode_shared_volume_header(int shm_key, ssc_volume * img);
int ssc_create_shm_header(int x_size, int y_size, int z_size, float pixel_x_size, float pixel_y_size, float pixel_z_size, std::string imaging_type, std::string dtype, int shm_key);

ssc_volume* ssc_cast_volume(ssc_volume *img, dtype_t dt);
ssc_volume* ssc_copy_volume(ssc_volume *img);

extern "C" {
	int ssc_create_shm_key(int baseId);

	bool ssc_decode_shared_volume_info(int shm_key, int *xsize, int *ysize, int *zsize, char **dtype, char **imaging_type, size_t *offset);

	bool ssc_alloc_shared_volume_and_return_data_offset(
		int shm_key,
		int xsize, 
		int ysize, 
		int zsize, 
		float pixel_x_size,
		float pixel_y_size,
		float pixel_z_size,
		const char *dtype, 
		const char *imaging_type,
		char *volume_array,
		size_t *offset);
		
	bool ssc_destroy_shared_volume(int restored_shm_key);

}


#endif