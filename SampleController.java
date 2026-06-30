package com.example.demo;

@RestController
@RequestMapping(value = "/api/v1/users")
public class SampleController {

    @GetMapping("/profile")
    public String getUserProfile() {
        return "Hello World";
    }

    @PostMapping("/create")
    public String createUser(@RequestBody CreateUserRequest request) {
        return "Created";
    }

    @RequestMapping(method = RequestMethod.PUT, value = "/update")
    public String updateUser(@PathVariable Long id, @RequestParam String name) {
        return "Updated";
    }

    @DeleteMapping("/delete")
    public String deleteUser(@PathVariable("id") Long userId) {
        return "Deleted";
    }
}